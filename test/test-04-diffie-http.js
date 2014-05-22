var request = require('request')
  , server = require('../service')
  , diffie = require('../diffie')
  , tape = require('tape')
  , fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  ;

var serve = server()

tape('http request and compare secrets', function (t) {
  t.plan(1)

  serve.listen(8080, function () {
    var d = diffie()
    d.getSigned(function (e, doc) {
      if (e) throw e
      var url = 'http://localhost:8080/_occupy/diffie'
      request.put(url, {json:doc}, function (e, r, body) {
        var secret = d.computeSecret(new Buffer(body.public, 'hex'), null, 'hex')
        t.equal(secret, serve.diffie.getSecret(body.token))
      })
    })
  })
})

var testData = fs.readFileSync(path.join(__dirname, '..', 'client.js'))

tape('compare data', function (t) {
  t.plan(2)

  var secret
    , token
    ;

  serve.listen(8080, function () {
    var d = diffie()
    d.getSigned(function (e, doc) {
      if (e) throw e
      var url = 'http://localhost:8080/_occupy/diffie'
      request.put(url, {json:doc}, function (e, r, body) {
        secret = d.computeSecret(new Buffer(body.public, 'hex'), null, 'hex')

        token = body.token
        var r = request.put('http://localhost:8080/test-05')
          , c = crypto.createCipher('aes192', secret)
          ;
        c.pipe(r)
        c.write(testData)
        c.end()
      })
    })
  })
  serve.on('request', function (req, res) {
    if (req.url !== '/test-05') return
    var text = ''
      , decipher = crypto.createDecipher('aes192', secret)
      ;

    t.equal(secret, serve.diffie.getSecret(token))

    req.pipe(decipher)

    decipher.on('data', function (chunk) {
      text += chunk
    })
    decipher.on('end', function () {
      t.equal(text, testData.toString())
      res.statusCode = 200
      res.end()
    })
  })
})

tape('cleanup', function (t) {
  serve.close()
  t.end()
})
