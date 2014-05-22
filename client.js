var diffie = require('./diffie')
  , qs = require('querystring')
  , once = require('once')
  , deploy = require('./deployer')
  , crypto = require('crypto')
  , request = require('request')
  , bopts = {headers:{'content-type':'application/octet-stream'}}
  ;

module.exports = function (path, url, cb) {
  cb = once(cb)
  var d = diffie()

  if (url[url.length - 1] !== '/') url += '/'

  d.getSigned(function (e, doc) {
    if (e) throw e
    request.put(url+'/_occupy/diffie', {json:doc}, function (e, r, body) {
      var secret = d.computeSecret(new Buffer(body.public, 'hex'), null, 'hex')
        , r = request.put(url+'/_occupy?'+qs.stringify({token:body.token}), bopts)
        , pack = deploy.packCrypto(path, secret)
        ;
      pack.pipe(r)
      r.on('response', function (resp) {
        var decipher = resp.pipe(crypto.createDecipher('aes192', secret))

        if (resp.statusCode !== 200) return cb(new Error('Status is not 200, '+resp.statusCode), decipher)
        decipher.end = function () {r.abort()}
        cb(null, decipher)
      })
      r.on('error', cb)
    })
  })
}
