var net = require('net')
  , limit = require('simple-rate-limiter')
  , once = require('once')
  ;

function isAvailable (port, cb) {
  cb = once(cb)

  var ping = limit(_ping).to(1200).per(1000 * 60)

  function _ping ()  {
    var client = net.connect({port: port}, function () {
      cb(null)
      clearTimeout(t)
      client.end()
    })
    client.on('error', function () {
      setTimeout(ping, 100)
    })
  }
  ping()
  var t = setTimeout(function () {
    cb(new Error('Could not connect'))
  }, 1000 * 60)
}

module.exports = isAvailable
