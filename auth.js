/**
 * Module dependencies.
 */
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BasicStrategy = require('passport-http').BasicStrategy
  , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
  , DigestStrategy = require('passport-http').DigestStrategy
  , BearerStrategy = require('passport-http-bearer').Strategy
  , db = require('./db');



/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log("AUTH: LocalStrategy")

    db.users.findByUsername(username, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (user.password != password) { return done(null, false); }

      for ( var p in user ) {
        console.log("user["+p+"] = " + user[p])
      }

      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  console.log("AUTH: serializeUser")

  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log("AUTH: deserializeUser")

  db.users.find(id, function (err, user) {
    done(err, user);
  });
});


/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function(username, password, done) {
    console.log("AUTH: BasicStrategy")

    db.clients.findByClientId(username, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != password) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientId, clientSecret, done) {
    console.log("AUTH: ClientPasswordStrategy")

    db.clients.findByClientId(clientId, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

/**
 * Use the DigestStrategy within Passport.
 *
 * This strategy requires a `secret`function, which is used to look up the
 * use and the user's password known to both the client and server.  The
 * password is used to compute a hash, and authentication will fail if the
 * computed value does not match that of the request.  Also required is a
 * `validate` function, which can be used to validate nonces and other
 * authentication parameters contained in the request.
 */
passport.use(new DigestStrategy({ qop: 'auth' },
    function(username, done) {
        // Find the user by username.  If there is no user with the given username
        // set the user to `false` to indicate failure.  Otherwise, return the
        // user and user's password.
        db.users.findByUsername(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            // only resource owners can access data
            if (user.type != 'owner') {
                var err = new Error('Only owners can access this resource');
                err.http_code = 401;
                return done(err);
            }
            return done(null, user, user.password);
        })
    },
    function(params, done) {
        // asynchronous validation, for effect...
        process.nextTick(function () {
            // check nonces in params here, if desired
            console.log('checking nonce');
            return done(null, true);
        });
    }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function(accessToken, done) {
    console.log("AUTH: BearerStrategy")

    db.accessTokens.find(accessToken, function(err, token) {
      if (err) { return done(err); }
      if (!token) { return done(null, false); }
      
      db.users.find(token.userID, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }

        var info = { scope: token.scope, expiration: token.expiration }
        done(null, user, info);
      });
    });
  }
));
