requirejs.config({
    paths: {
        app: 'app',
        d3: 'lib/d3/d3.v3.min',
        jquery: 'lib/jquery-2.0.3/jquery.min',
        bootstrap: 'lib/bootstrap-3.0.0/js/bootstrap.min',
        handlebars: 'lib/handlebars-1.3.0/handlebars-v1.3.0',
        underscore: 'lib/underscore-1.6.0/underscore-min',
        router: 'lib/router'
    },
    hbs: {
        templateExtension: ".html"
    },
    packages: [
    {
      name: 'hbs',
      location: 'lib/requirejs-hbs',
      main: 'hbs'
    }],
    shim: {
        d3: {
            exports: "d3"
        },
        bootstrap: ['jquery'],
        router: {
            exports: "router"
        },
    }
});

require(['app/app'], function(app) {
    "use strict";
    var application = new app.App();
    application.start(); // or whatever startup logic your app uses.
});
