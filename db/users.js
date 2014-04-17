var users = [
    { id: '1', username: 'bob', password: 'secret', name: 'Bob Smith', phoneNumber: '785-873-3930', email: 'bob@email.com', address: '968 Sherman Street, Everest', birthday: '02-02-1992', type: 'owner', MemberMlsId: 21595},
    { id: '2', username: 'joe', password: 'password', name: 'Joe Davis', phoneNumber: '802-737-2671', email: 'joe@email.com', address: '2761 Hardman Road, Winooski', birthday: '05-10-1942', type: 'owner' },
    { id: '3', username: 'fred', password: 'money', name: 'Fred Couples', phoneNumber: '802-737-2671', email: 'joe@email.com', address: '2761 Hardman Road, Winooski', birthday: '05-10-1942', type: 'vendor' }
];


exports.find = function(id, done) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.id === id) {
      return done(null, user);
    }
  }
  return done(null, null);
};

exports.findByUsername = function(username, done) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return done(null, user);
    }
  }
  return done(null, null);
};
