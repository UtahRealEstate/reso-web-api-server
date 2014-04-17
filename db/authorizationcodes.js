var config = require('../config');

var codes = {};


exports.find = function(key, done) {
  console.log(codes);
  var code = codes[key];
  return done(null, code);
};

exports.save = function(code, clientID, redirectURI, userID, scope, done) {
  var expiration = new Date().getTime() + (config.tokenExpire * 1000);
  codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID, scope: scope, expiration: expiration  };
  return done(null);
};
