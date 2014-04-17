require('odata-server');
var passport = require('passport')
  , http     = require('http')
  , https    = require('https')
  , express  = require('express')
  , app      = express()
  , fs       = require('fs')
  , site     = require('./site')
  , partials = require('express-partials')
  , oauth2   = require('./oauth2')
  , user     = require('./user')



app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

// version header every where
app.use(function(req, res, next) {
    res.header('RESO-OData-Version', '1.0.0');
    next();
})
// app config
var config = require('./config');

/**
 * Default express error handler
 *  -according to the RESO A&A doc returns JSON
 */
app.use(function(err, req, res, next) {
    console.log(err);
    if (err.http_code !== undefined) {
        res.status(err.http_code);
    }
    res.json({error: err.message});
});

// Passport configuration
require('./auth');

var contextType = require('./context/DataSystems.js');

// empty the meta collection
var context = new RESO.Context({ name: 'mongoDB', databaseName: 'meta', dbCreation: $data.storageProviders.DbCreationType.DropAllExistingTables });


context.onReady(function(db) {

    contextType.loadData({db: db, hostname: config.hostname}, function(count) {

        var services = [
            {path: '/RESO/OData/Property', database: 'reso_test1', type: require('./context/Property.js'), responseLimit: 10},
            {path: '/RESO/OData/', database: 'foo', type: contextType}
        ];

        // set up the services
        for (var i = 0; i < services.length; i++) {
            svc = services[i];

             // Authenticate
            app.all(svc.path + "*", passport.authenticate(['digest', 'bearer'], { session: false }));
            app.use(svc.path, $data.ODataServer(svc));
        }

        app.get('/',                            site.index);
        app.get('/login',                       site.loginForm);
        app.post('/login',                      site.login);
        app.get('/logout',                      site.logout);
        app.get('/account',                     site.account);
        app.get('/grants',                      site.grants);
        app.get('/client',                      site.clients);
        app.get('/debug',                       site.debug);
        app.get('/dialog/authorize',            oauth2.authorization);
        app.post('/dialog/authorize/decision',  oauth2.decision);
        app.post('/oauth/token',                oauth2.token);
        app.get('/api/userinfo',                user.info);

        // Protected resource, requires "personaldata" scope
        app.get('/api/user/personaldata', user.personaldata);

        // set up the SSL
        var httpsServer = https.createServer({
            key:  fs.readFileSync(config.sslKey, 'utf8'),
            cert: fs.readFileSync(config.sslCert, 'utf8')
        }, app);

        httpsServer.listen(config.sslPort);

        console.log('http listening on ' + config.sslPort);

        // the HTTP server is only used to redirect traffic to the HTTPS server
        if (config.port !== undefined){
            var httpServer = http.createServer(app);
            httpServer.listen(config.port);
            console.log('http listening on ' + config.port);
        }

    });
});