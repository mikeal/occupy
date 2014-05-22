var fs = require('fs')
  , path = require('path')
  , security = require('../security')
  , tape = require('tape')
  , diffie = require('../diffie')()
  , crypto = require('crypto')
  , fs = require('fs')
  , path = require('path')
  , base64 = function (str) {return (new Buffer(str)).toString('base64')}
  , public = require('authorized-keys')()
  ;

tape('agent sign', function (t) {
  t.plan(1)

  diffie.getSigned(function (e, doc) {
    if (e) throw e

    t.ok(security.verify(new Buffer(doc.public, 'hex'), fs.readFileSync(public), doc.signature))
  })
})

tape('verify sign', function (t) {
  var d = crypto.getDiffieHellman('modp5')
  d.generateKeys()
  var pub = d.getPublicKey()

  t.plan(1)

  security.signWithAgent(pub, function (e, signed) {
    if (e) throw e
    signed = new Buffer(signed, 'base64')

    diffie.verifyAndRespond(pub, public, signed, function (e, doc) {
      if (e) throw e

      var p = new Buffer(doc.public, 'hex')
      var secret = d.computeSecret(p, null, 'hex')
      t.equal(secret, diffie.getSecret(doc.token))
    })
  })
})
