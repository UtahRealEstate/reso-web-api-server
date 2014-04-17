/**
 * Module dependencies.
 */
var passport = require('passport')
    , login  = require('connect-ensure-login')
    , config = require('./config');


exports.index = function(req, res) {
    if (req.protocol == 'http') {
        res.redirect('')
        res.redirect(301, 'https://' + config.hostname + ':' + config.sslPort);
    } else {
        res.render('index', { user: req.user});
    }
};

exports.loginForm = function(req, res) {
    res.render('login');
};

exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' });

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
}

exports.account = [
    login.ensureLoggedIn(),
    ensureOwner(),
    function(req, res) {
        res.render('account', { user: req.user });
    }
];

exports.grants = [
    login.ensureLoggedIn(),
    ensureOwner(),
    function(req, res) {
        var accesstokens  = require('./db/accesstokens.js');
        accesstokens.findByUserId(req.user.id, function(err, list) {
            res.render('grants', {grants: list});
        });
    }
]


exports.clients = [
    login.ensureLoggedIn(),
    ensureVendor(),
    function(req, res) {
        var clients  = require('./db/clients.js');
        clients.findByUserId(req.user.id, function(err, client) {
            res.render('client', {'client': client});
        });
    }
];

exports.debug = [
    login.ensureLoggedIn(),
    ensureVendor(),
    function(req, res) {
        res.render('debug', { user: req.user});
    }
]

function ensureOwner() {
    return function(req, res, next) {
        if (req.user.type !== 'owner') {
            res.redirect('/');
        } else {
            next();
        }
    }
}

function ensureVendor() {
    return function(req, res, next) {
        if (req.user.type !== 'vendor') {
            res.redirect('/');
        } else {
            next();
        }
    }
}