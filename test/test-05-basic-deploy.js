var request = require('request')
  , server = require('../service')
  , diffie = require('../diffie')
  , tape = require('tape')
  , path = require('path')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , input = path.join(__dirname, 'test-05')
  , output = path.join(__dirname, 'deploy05')
  , client = require('../client')
  ;

fs.mkdirSync(output)

var serve = server(output)

tape('http request and compare secrets', function (t) {
  t.plan(2)

  serve.listen(8080, function () {
    client(input, 'http://localhost:8080', function (e, resp) {
      if (e) throw e
      resp.pipe(process.stdout)
      var _resp = resp
      request.get('http://localhost:8080', function (e, resp, body) {
        t.equal(resp.statusCode, 200)
        t.equal(body, 'Hello World.')
        _resp.end()
      })
    })
  })
})

tape('cleanup', function (t) {
  rimraf.sync(output)
  serve.close()
  t.end()
})
