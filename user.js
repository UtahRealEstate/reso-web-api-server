/**
 * Module dependencies.
 */
var passport = require('passport')

exports.info = [
  passport.authenticate('bearer', { session: false }),
  function(req, res) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`.  It is typically used to indicate scope of the token,
    // and used in access control checks.  For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
  }
]


exports.personaldata = [
	passport.authenticate('bearer', { session: false }),
    ensureValidToken("personaldata"),
	function(req, res) {
        res.json(req.user)
	}
]


function ensureValidToken (scope) {
  return function (req, res, next) {
    // Check token expiration
    if ( req.authInfo.expiration < new Date().getTime() ) {
      res.set({'WWW-Authenticate': "Bearer realm='RESO API Server', error='expired_token'"});
      res.status(401);
      //res.send('expired token');
      res.json({"message": "Access token has expired"});
    } else if ( !req.authInfo || !req.authInfo.scope || req.authInfo.scope.indexOf(scope) == -1 ) {
      res.send(403);
    } else {
      next();
    }
  };
}
