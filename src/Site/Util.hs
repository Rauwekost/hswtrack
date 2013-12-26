{-# LANGUAGE OverloadedStrings #-}

module Site.Util (
    reader
  , logFail
  , logRunEitherT
  , parseDouble
  , tryGetParam
  , getDoubleParam
  , getDoubleParamOrEmpty
  , getIntParam
  , getTextParam
  , withDb
  , module Snap.Core
  , module Snap.Snaplet
  , module Snap.Snaplet.Auth
  , module Site.Application
  ) where

------------------------------------------------------------------------------
import           Control.Error.Safe (tryJust)
import           Control.Monad.Trans (lift)
import           Control.Monad.Trans.Either
import           Data.ByteString (ByteString)
import qualified Data.Text as T
import qualified Data.Text.Encoding as T
import qualified Data.Text.Read as T
import           Database.SQLite.Simple as S
import           Snap.Core
import           Snap.Extras.CoreUtils
import           Snap.Snaplet
import           Snap.Snaplet.Auth
import           Snap.Snaplet.SqliteSimple
------------------------------------------------------------------------------
import           Site.Application
------------------------------------------------------------------------------

type H = Handler App App

-- | Run an IO action with an SQLite connection
withDb :: (S.Connection -> IO a) -> H a
withDb action =
  withTop db . withSqlite $ \conn -> action conn

reader :: T.Reader a -> T.Text -> Either String a
reader p s =
  case p s of
    Right (a, "") -> return a
    Right (_, _) -> Left "readParser: input not exhausted"
    Left e -> Left e

-- | Log Either Left values or run the Handler action.  To be used in
-- situations where to user shouldn't see an error (either due to it
-- being irrelevant or due to security) but we want to leave a trace
-- of the error and finish with a HTTP error code 400.
logFail :: Either String (H ()) -> H ()
logFail = either failReq id
  where
    failReq msg = do
      let e = T.encodeUtf8 . T.pack $ msg
      logError e
      badReq e


logRunEitherT :: EitherT String H (H ()) -> H ()
logRunEitherT e = runEitherT e >>= logFail

parseDouble :: T.Text -> EitherT String H Double
parseDouble t =
  hoistEither (reader T.rational $ t)

tryGetParam :: MonadSnap m => ByteString -> EitherT [Char] m ByteString
tryGetParam p =
  lift (getParam p) >>= tryJust ("missing get param '"++ show p ++"'")

getIntParam :: ByteString -> EitherT String H Int
getIntParam n =
  tryGetParam n >>= \p -> hoistEither (reader T.decimal . T.decodeUtf8 $ p)

getDoubleParam :: ByteString -> EitherT String H Double
getDoubleParam n =
  getTextParam n >>= \p -> parseDouble p

getDoubleParamOrEmpty :: ByteString -> EitherT String H (Maybe Double)
getDoubleParamOrEmpty n = do
  v <- getTextParam n
  if v == "" then return Nothing else parseDouble v >>= return . Just

getTextParam :: ByteString -> EitherT String H T.Text
getTextParam n =
  tryGetParam n >>= \p -> return . T.decodeUtf8 $ p
