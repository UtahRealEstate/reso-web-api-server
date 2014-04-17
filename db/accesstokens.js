var tokens = {}
  , refreshTokens = {}

var config = require('../config');


exports.find = function(key, done) {
  var token = tokens[key];
  if ( !token ) {
      var err = new Error("Access token not found", 'token_404');
      err.http_code = 401;
      return done(err);
  }
  return done(null, token);
};

exports.save = function(token, refreshToken, userID, clientID, scope, done) {
  //var expiration = new Date().getTime() + (EXPIRES_IN * 1000);
  var expiration = new Date().getTime() + (config.tokenExpire * 1000);
  tokens[token] = { userID: userID, clientID: clientID, scope: scope, expiration: expiration };
  refreshTokens[refreshToken] = token;
  return done(null);
};

exports.findRefresh = function (refreshToken, done) {
  var rtoken = refreshTokens[refreshToken];
  if ( !rtoken ) { return done(new Error("Refresh token not found")); }
  return done(null, rtoken);
};

exports.findByUserId = function(userID, done) {
    var ret = [];
    console.log(tokens);
    for (var i in tokens) {
        var token = tokens[i];
        token.token = i;
        if (token.userID === userID) {
            ret.push(token);
        }
    }
    return done(null, ret);
//    return done(null, null);
};

exports.delete = function(token, done) {
  delete tokens[token];
	return done(null);
};
