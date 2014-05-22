var SSHAgentClient = require('ssh-agent')
  , fs = require('fs')
  , crypto = require('crypto')
  , ursa = require('ursa')
  , toPEM = require('ssh-key-to-pem')
  , request = require('request')
  , client = new SSHAgentClient()
  ;

// Try to sign data with an RSA key (will generate
// an RSA-SHA1 signature).

function sign (data, cb) {
  client.requestIdentities(function(err, keys) {
    var key = null

    for (var i = 0; i < keys.length; i++) {
      if (keys[i].type === 'ssh-rsa') {
        key = keys[i]
        break
      }
    }

    if (!key) return cb(new Error('ssh-agent does not have an ssh-rsa key.'))

    if (!Buffer.isBuffer(data)) data = new Buffer(data)

    client.sign(key, data, function(err, signature) {
      if (err) return cb(err)
      cb(null, signature.signature)
    })
  })
}

exports.signWithAgent = sign

function verify (data, pub, signed) {
  if (typeof pub !== 'string') pub = String(pub)
  if (/^ssh-\w+/.test(pub)) pub = toPEM(pub)

  if (!Buffer.isBuffer(data)) data = new Buffer(data)
  if (!Buffer.isBuffer(signed)) signed = new Buffer(signed, 'base64')

  var pubkey = ursa.createPublicKey(pub)

  return pubkey.hashAndVerify('sha1', data, signed, 'binary')
}

exports.verify = verify
