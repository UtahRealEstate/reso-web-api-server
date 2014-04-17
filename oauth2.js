/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize')
  , passport    = require('passport')
  , login       = require('connect-ensure-login')
  , db          = require('./db')
  , utils       = require('./utils')
  , config      = require('./config');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  db.clients.find(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});


// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view. 


// 1
exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization(function(clientID, redirectURI, scope, state, done) {

    console.log("* oAuth2 clientID[", clientID,"] redirectURI[", redirectURI, "] scope[", scope,"] state[", state, "]");

    db.clients.findByClientId(clientID, function(err, client) {
      if (err) { return done(err); }

      var uris = client.redirectURI;
      var found = false;

      for(var i = 0; i<uris.length; i++) {
        if (uris[i] == redirectURI) {
            found = true;
            break;
        }
      }

      if (!found ) {
        //return done({status: 401, message: 'bad redirect URI'});
        return done( new Error('Invalid redirectURI.') );
      }
      
      console.log("* Authorization client[", client ,"]");

      return done(null, client, redirectURI);
    });
  }),
  function(req, res) {
      if (req.user.type == 'vendor') {
          res.redirect('/');
      } else {
        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client, scope: req.query['scope'] });
      }
  },
    server.errorHandler({ mode: 'indirect' })
]
//app.get('/dialog/authorize',
//    *       login.ensureLoggedIn(),
//    *       server.authorization( ... )
//*       server.errorHandler({ mode: 'indirect' }));
// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

// 2
exports.decision = [
   login.ensureLoggedIn(),
   server.decision(function(req, done) {
     return done(null, { scope: req.body.scope })
   })
];

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

// 3
server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16);

  console.log("* Get grant code client[", client, "] code[", code ,"] ares[", ares ,"] user[", user ,"]");
  
  db.authorizationCodes.save(code, client.id, redirectURI, user.id, ares.scope, function(err) {
    if (err) { return done(err); }
    done(null, code);
  });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

// 4
server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  db.authorizationCodes.find(code, function(err, authCode) {
    if (err) { return done(err); }
    if (client.id !== authCode.clientID) { return done(null, false); }
    if (redirectURI !== authCode.redirectURI) { return done(null, false); }
    
    var token = utils.uid(25);
    var refreshToken = utils.uid(25);
    
    console.log("* Get access token [" + token + "] code[" + code + "] scope[" + authCode.scope + "]");

    db.accessTokens.save(token, refreshToken, authCode.userID, authCode.clientID, authCode.scope, function(err) {
      if (err) { return done(err); }
      done(null, token, refreshToken, { 'expires_in': config.tokenExpire }); // expires_in: only for client information
    });
  });
}));

server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
  console.log("* Refresh access token client[", client, "] refreshToken[" + refreshToken + "]");

  db.accessTokens.findRefresh(refreshToken, function (err, accessTokenToRefresh) {
    if (err) { return done(err); }

    console.log("- refresh token valid");

    db.accessTokens.find(accessTokenToRefresh, function (err, accessTokenDB) {
      if (err) { return done(err); }

      console.log("- old access token found");

      var newToken = utils.uid(25);
      var newRefreshToken = utils.uid(25);

      db.accessTokens.save(newToken, newRefreshToken, accessTokenDB.userID, accessTokenDB.clientID, accessTokenDB.scope, function(err) {
        if (err) { return done(err); }

        console.log("- new access/refresh token saved");

        db.accessTokens.delete(accessTokenToRefresh, function (err) {
          if (err) { return done(err); }

          console.log("- old access token deleted");
          
          done(null, newToken, newRefreshToken, { 'expires_in': config.tokenExpire });
        });

      });
    });
  });

}));

/**
 * Exchange resource owner's login and password for access token
 */
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
  AccessToken.create(client, username, password, scope, function(err, accessToken) {
    if (err) { return done(err); }
      done(null, accessToken);
    });
  })
);

// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]
