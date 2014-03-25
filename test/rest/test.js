"use strict";

var Q      = require('q')
  , qr     = Q.denodeify(require('request'))
  , _      = require('underscore')
  , config = require('./config')
  , Class  = require('class.js');

var Test = Class({
    init: function () {
    },

    description: function () {
        throw new Error("Test.description must be overridden");
    }
});

var URL = "http://localhost:8000";

function logGets() {
    return config.logging.getBody;
}

function restUrl(s) {
    return URL + s;
}

function get(params) {
    return qr(_.extend(params, { method: 'GET' }))
          .then(function (r) {
              if (logGets()) {
                  console.log("GET: "+r[0].body);
              }
              return r[0];
          });
}

function assert(cond, msg) {
    if (!cond) {
        var m = msg ? msg : "";
        throw new Error("test assertion failed: " + m);
    }
}

function assertStatusCodeOK(r) {
    assert(r.statusCode < 300,
           'Server responded with status code ' + r.statusCode + ' - ' + r.body);
}

module.exports = {
    Test:     Test
  , restUrl:  restUrl
  , qrequest: qr
  , get:      get
  , assert: assert
  , assertStatusCodeOK: assertStatusCodeOK
};
