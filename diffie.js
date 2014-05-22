var crypto = require('crypto')
  , security = require('./security')
  , fs = require('fs')
  ;

module.exports = function () {
  var publicKeys = {}
  , d = crypto.getDiffieHellman('modp5')
  , exports = {}
  ;

  d.generateKeys()
  exports = d

  exports.getSigned = function (cb) {
    var pub = d.getPublicKey()

    security.signWithAgent(pub, function (e, signed) {
      if (e) return cb(e)
      cb(null, {public:pub.toString('hex'), signature:signed})
    })
  }

  exports.verifyAndRespond = function (publicRSA, authorizedKeys, signature, cb) {
    publicRSA = new Buffer(publicRSA, 'hex')

    fs.readFile(authorizedKeys, function (e, data) {
      if (e) return cb(e)
      var keys = data.toString().split('\n').filter(function (s) {return s.length})
      while (keys.length) {
        if (security.verify(publicRSA, keys.shift(), signature)) return finish()
      }
      return cb(new Error('Signature does not match public key.'))
    })

    function finish () {
      var key = Math.random().toString(36).substring(7)
      publicKeys[key] = publicRSA
      cb(null, { public: d.getPublicKey().toString('hex'), token: key })
    }
  }

  exports.getSecret = function (token)  {
    return d.computeSecret(new Buffer(publicKeys[token], 'hex'), null, 'hex')
  }

  return exports
}
