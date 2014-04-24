var clients = [
    { id: '1', name: 'SampleApp', clientId: 'abc123', clientSecret: 'ssh-secret', userId: '3', redirectURI: ['http://reso.fredish.com:8080/auth/appexample/callback'
                                                                                                            ,'http://reso.wfrmls.com:8080/auth/appexample/callback']}
];

exports.find = function(id, done) {
    for (var i = 0, len = clients.length; i < len; i++) {
        var client = clients[i];
        if (client.id === id) {
            return done(null, client);
        }
    }
    return done(null, null);
};

exports.findByClientId = function(clientId, done) {
    for (var i = 0, len = clients.length; i < len; i++) {
        var client = clients[i];
        if (client.clientId === clientId) {
            return done(null, client);
        }
    }
    return done(null, null);
};

exports.findByUserId = function(userId, done) {
    console.log('finding client for user: ' + userId);
    for (var i = 0, len = clients.length; i < len; i++) {
        var client = clients[i];

        if (client.userId === userId) {
            return done(null, client);
        }
    }
    return done(null, null);
}
