/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
exports.uid = function(len) {
  var buf = []
    , chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    //, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.ensureValidToken = function(scope) {
    return function (req, res, next) {
//        console.log("ensureScope[" + scope + "], req.authInfo=", req.authInfo)
//        console.log("req.user=", req.user)

        // Check token expiration
        if ( req.authInfo.expiration < new Date().getTime() ) {
            res.send(401);
        } else if ( !req.authInfo || !req.authInfo.scope || req.authInfo.scope.indexOf(scope) == -1 ) {
            res.send(403);
        } else {
            next();
        }
    };
}