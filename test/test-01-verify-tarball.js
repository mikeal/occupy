var fs = require('fs')
  , path = require('path')
  , deploy = require('../deploy')
  , input = path.join(__dirname, '..', 'node_modules')
  , output = path.join(__dirname, 'deploy01')
  , tape = require('tape')
  , rimraf = require('rimraf')
  ;

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
  var compressed = deploy.pack(path.join(__dirname, '..'))
    , decompressed = deploy.unpack(output)
    ;
  // decompressed.__end = decompressed.end
  // decompressed.end = function () {
  //   verify()
  //   decompressed.__end.apply(decompressed, arguments)
  // }
  decompressed.on('end', function () {
    setTimeout(function () {
      verify()
    }, 500)
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

tape('cleanup', function (t) {
  rimraf.sync(output)
  t.end()
})
