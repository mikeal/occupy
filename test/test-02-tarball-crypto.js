var fs = require('fs')
  , path = require('path')
  , deploy = require('../deploy')
  , input = path.join(__dirname, '..', 'node_modules')
  , tape = require('tape')
  , rimraf = require('rimraf')
  , diffie = require('../diffie')()
  , request = require('request')
  , http = require('http')
  ;

var d = require('crypto').getDiffieHellman('modp5')
d.generateKeys()
var secret = d.computeSecret(diffie.getPublicKey(), 'null', 'hex')

function walkSync (dir, cb) {
  var files = fs.readdirSync(dir)
  files.forEach(function (f) {
    var stat = fs.statSync(path.join(dir, f))
    if (stat.isDirectory()) {
      walkSync(path.join(dir, f), cb)
    } else if (stat.isFile()) {
      cb(path.join(dir, f))
    }
  })
}

tape('verify tarball', function (t) {
  var output = path.join(__dirname, 'deploy02-raw')
    , compressed = deploy.packCrypto(path.join(__dirname, '..'), secret)
    , decompressed = deploy.unpackCrypto(output, secret)
    ;
  // decompressed.__end = decompressed.end
  // decompressed.end = function () {
  //   verify()
  //   decompressed.__end.apply(decompressed, arguments)
  // }
  decompressed.on('end', function () {
    setTimeout(function () {
      verify()
    }, 1000)
  })
  compressed.pipe(decompressed)

  function verify (dir) {
    walkSync(input, function (f) {
      var n = f.replace(dir, output)
      t.equals(fs.readFileSync(f).toString(), fs.readFileSync(n).toString())
    })
  }

  var count = 0
  walkSync(input, function (f) {
    count++
  })
  t.plan(count)
})

tape('verify tarball over http', function (t) {
  var output = path.join(__dirname, 'deploy02-http')

  server = http.createServer(function (req, res) {
    var decompressed = deploy.unpackCrypto(output, secret)

    decompressed.on('end', function () {
      setTimeout(function () {
        verify()
      }, 1000)
      res.statusCode = 200
      res.end()
    })
    req.pipe(decompressed)

  }).listen(8585, function () {

    var compressed = deploy.packCrypto(path.join(__dirname, '..'), secret)
    compressed.pipe(request.put('http://localhost:8585'))
  })

  function verify (dir) {
    walkSync(input, function (f) {
      var n = f.replace(dir, output)
      t.equals(fs.readFileSync(f).toString(), fs.readFileSync(n).toString())
    })
  }

  var count = 0
  walkSync(input, function (f) {
    count++
  })
  t.plan(count)
})

tape('cleanup', function (t) {
  rimraf.sync(path.join(__dirname, 'deploy02-raw'))
  rimraf.sync(path.join(__dirname, 'deploy02-http'))
  server.close()
  t.end()
})
