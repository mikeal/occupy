var http = require('http')
  , request = require('request')
  , path = require('path')
  , response = require('response')
  , fs = require('fs')
  , url = require('url')
  , qs = require('querystring')
  , crypto = require('crypto')
  , authorizedKeys = require('authorized-keys')
  , jsonbody = require('json-body')
  , diffieModule = require('./diffie')
  , deploy = require('./deployer')
  , message = require('./message')
  ;

function Proxy ()  {
  this.pending = []
  this._release = this.release.bind(this)
}
Proxy.prototype.onRequest = function (req, res) {
  if (!this.state || !this.state.port) return this.pending.push([req, res])
  req.pipe(request('http://localhost:'+this.state.port+req.url)).pipe(res)
}
Proxy.prototype.onDeploy = function (state) {
  if (!this.state || state.ts > this.state.ts) {
    if (this.state) {
      this.state.removeListener('release', this._release)
      this.state.kill()
    }

    this.state = state
    this.state.on('release', this._release)
  } else {
    console.error('Timestamp is older than current deploy.')
  }
}
Proxy.prototype.release = function  () {
  while (this.pending.length) {
    var x = this.pending.shift()
    this.onRequest.call(this, x[0], x[1])
  }
}

module.exports = function (basepath, opts) {
  var diffie = diffieModule()
    , proxy = new Proxy()
    ;

  if (!opts) opts = {}
  if (!opts.publicKey) {
    try {
      opts.authorizedKeys = authorizedKeys()
      fs.readFileSync(opts.authorizedKeys)
    } catch(e) {
      throw new Error('Could not find authorized keys, please set opts.authorizedKeys to your authorized_keys file.')
    }
  }

  function occupy (req, res) {
    var p = req.url.slice(req.url.indexOf('/_occupy')+'/_occupy'.length)
    if (p === '/diffie') return diffieRoute(req, res)
    var ts = Date.now().toString()
      , queries = qs.parse(url.parse(req.url).query)
      , secret = diffie.getSecret(queries.token)
      , output = path.join(basepath, ts)
      , decompressed = deploy.unpackCrypto(output, secret, finish)
      ;
    if (!secret) return response.error(new Error('invalid token')).pipe(res)

    function finish (e) {
      if (e) throw e

      var cipher = crypto.createCipher('aes192', secret)
      res.statusCode = 200
      cipher.pipe(res)
      var msg = message(cipher)
      msg.log('Unpack Complete.')
      msg.log('Deploy ID:', ts)
      deploy.run(output, cipher, msg, function (e, _state) {
        _state.ts = parseInt(ts)
        if (e) return msg.error('Deploy failed.')
        proxy.onDeploy(_state)
        msg.log('Deploy successful.')
      })
    }

    req.pipe(decompressed)
  }

  function diffieRoute (req, res) {
    jsonbody(req, function (e, body) {
      if (e) return response.error(e).pipe(res)
      var pub = body.public
        , auth = opts.authorizedKeys
        , signed = body.signature
        ;
      diffie.verifyAndRespond(pub, auth, signed, function (e, doc) {
        if (e) return response.error(e).pipe(res)
        response.json(doc).pipe(res)
      })
    })
  }

  function listener (req, res) {
    if (req.url.indexOf('/_occupy') !== -1) {
      occupy(req, res)
    } else {
      proxy.onRequest(req, res)
    }

    if (req.url === '/_occupy') {
      res.statusCode = 200
      var time = JSON.stringify(new Date())
        , p = path.join(basepath, time)
        , msg = message(res)
        ;
      msg('Starting new deployment to', p)
      deploy.unpackage(basepath, req, msg)
    }

    if (req.url === '/_occupy/diffie') {
      res.statusCode = 200
      // connect to diffie exchange
    }
  }

  var server = http.createServer(listener)
  server.diffie = diffie
  server.on('close', function () {
    if (proxy.state) proxy.state.kill()
  })
  return server
}
