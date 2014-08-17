
define(['jquery', 'handlebars', 'bootstrap', 'd3', 'router', 'app/weight', 'app/workout', 'app/stats', 'hbs!templates/login', 'hbs!templates/settings'],
       function($, Handlebars, bootstrap, d3, router, weight, workout, stats, templateLogin, templateSettings) {
    "use strict";

    function loadAppContext() {
        return $.ajax({
            type: "GET",
            url: "/rest/app",
            data: []
        });
    }

    function App() {
        this.router = new Router();
    }

    App.prototype.checkLogin = function(err) {
        if (err.status == 403) {
            this.router.navigate("/login");
        }
    };

    App.prototype.renderLoginScreen = function(context, url) {
        var self = this;
        var ctx = context ? context : {};

        if (url == "new_user")
            ctx.loginForm = false;
        else if (url == "login")
            ctx.loginForm = true;

        $("#app-container").html(templateLogin(ctx));

        $("form#login").submit(function (e) {
            e.preventDefault();
            $.ajax({ url: "/rest/"+url,
                     type: "POST",
                     data: $(this).serialize(),
                     success: function(resp) {
                         if (!resp.loggedIn) {
                             self.renderLoginScreen(resp, url);
                         } else {
                             self.router.navigate("/");
                         }
                     }});
        });
    };

    App.prototype.renderNewUser = function() {
        this.renderLoginScreen(null, "new_user");
    };

    App.prototype.renderLogin = function() {
        this.renderLoginScreen(null, "login");
    };

    App.prototype.renderSettings = function() {
        var self = this;
        $.when(loadAppContext()).done(
            function (app) {
                $("#app-container").html(templateSettings(app.context));
            });
    };

    App.prototype.start = function () {
        var self = this;

        Handlebars.registerHelper('round', function(num, dec) {
            return new Handlebars.SafeString(num.toFixed(dec));
        });

        Handlebars.registerHelper('ifBodyweight', function(v, options) {
            if(v.type === "BW") {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        Handlebars.registerHelper('dateString', function(v, options) {
            return new Handlebars.SafeString((new Date(v)).toLocaleString());
        });

        // Instruct router to go to the login screen if any latter AJAX
        // call returns "Login required" 403.
        $.ajaxSetup({ error: function (jqXHR, ts, e) {
            self.checkLogin(jqXHR);
        }});

        var weightView = new weight.WeightView();
        var et = new workout.ExerciseTypeView();
        var w  = new workout.WorkoutView();
        var s  = new stats.StatsView();

        self.router.route("/workout/:id", function (id) { w.render(id); });
        self.router.route("/workout",     function ()   { w.render(null); });
        self.router.route("/workout/add-exercise",
                   function () { et.render(); });
        self.router.route("/stats",       function ()   { s.render(); });
        self.router.route("/settings",    function()    { self.renderSettings(); });
        self.router.route("/login",       function()    { self.renderLogin(); });
        self.router.route("/new_user",    function()    { self.renderNewUser(); });
        self.router.route("/",            function()    { weightView.render(); });
        self.router.start();
    };

    // export
    return {
        'App': App
    };
});
