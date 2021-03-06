{-# LANGUAGE OverloadedStrings, ScopedTypeVariables #-}

------------------------------------------------------------------------------
-- | This module is where all the routes and handlers are defined for your
-- site. The 'app' function is the initializer that combines everything
-- together and is exported by this module.
module Site.Site
  ( app
  ) where

------------------------------------------------------------------------------
import           Control.Applicative
import           Control.Concurrent
import           Control.Monad.Trans (liftIO)
import           Control.Lens
import           Data.ByteString (ByteString)
import qualified Data.Configurator as Cfg
import qualified Data.Text as T
import           Snap.Snaplet.Auth.Backends.SqliteSimple
import           Snap.Snaplet.Session.Backends.CookieSession
import           Snap.Snaplet.SqliteSimple
import           Snap.Util.FileServe
------------------------------------------------------------------------------
import qualified Model
import           Site.Application
import           Site.REST
import           Site.Util
------------------------------------------------------------------------------

type H = Handler App App

handleLoginSubmit :: H ()
handleLoginSubmit =
  with auth $ loginUser "login" "password" (Just "remember")
    (\_ -> restLoginError "Incorrect login or password")
    (withTop' id restAppContext)

-- | Logs out and redirects the user to the site index.
handleLogout :: H ()
handleLogout = with auth logout >> redirect "/"

-- | Handle new user form submit
handleNewUser :: H ()
handleNewUser =
  method POST $ do
    authUser <- with auth $ registerUser "login" "password"
    either respondNewUserErr login authUser

  where
    login user = with auth (forceLogin user) >> restAppContext

    respondNewUserErr (err :: AuthFailure) =
      restLoginError (T.pack . show $ err)


-- | The application's routes.
routes :: String -> [(ByteString, Handler App App ())]
routes staticAssetDir =
  [ ("/rest/login",    handleLoginSubmit)
  , ("/rest/user",     method PUT restModifyUser)
  , ("/rest/new_user", handleNewUser)
  , ("/logout",        handleLogout)
  , ("/rest/app",      method GET restAppContext)
  , ("/rest/weight",   method GET restListWeights <|> method POST restSetWeight <|> method DELETE restClearWeight)
  , ("/rest/note",     method GET restListNotes <|>method POST restAddNote <|> method DELETE restDeleteNote)
  , ("/rest/exercise", method GET restListExerciseTypes <|> method POST restNewExerciseType)
  , ("/rest/workout/exercise", method POST restAddExerciseSet <|> method DELETE restDeleteExerciseSet)
  , ("/rest/workout",  method POST restNewWorkout)
  , ("/rest/workout",  method GET restQueryWorkouts)
  , ("/rest/workout",  method PUT restModifyWorkout)
  , ("/rest/stats/workout", method GET restQueryWorkoutHistory)
  , ("/favicon.ico",   serveFile (staticAssetDir ++ "/favicon.ico"))
  , ("/static",        serveDirectory staticAssetDir)
  , ("/",              serveFile (staticAssetDir ++ "/index.html"))
  ]

-- | The application initializer.
app :: SnapletInit App App
app = makeSnaplet "app" "An snaplet example application." Nothing $ do
    -- Allow specifying an alternate '/static' directory for
    -- html/js static assets.  This way we can point the '/static'
    -- route to a minified JS built application.
    cc <- getSnapletUserConfig
    staticAssetDir <- liftIO $ Cfg.lookupDefault "static" cc "static-asset-dir"

    addRoutes (routes staticAssetDir)
    s <- nestSnaplet "sess" sess $
           initCookieSessionManager "site_key.txt" "sess" Nothing (Just (14*24*3600))

    -- Initialize auth that's backed by an sqlite database
    d <- nestSnaplet "db" db sqliteInit
    a <- nestSnaplet "auth" auth $ initSqliteAuth sess d

    -- Grab the DB connection pool from the sqlite snaplet and call
    -- into the Model to create all the DB tables if necessary.
    let c = sqliteConn $ d ^# snapletValue
    liftIO $ withMVar c $ \conn -> Model.createTables conn
    return $ App s d a
