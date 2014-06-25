var sequest = require('../sequest')

function occupy (host, module, cb) {
  var seq = sequest.connect(host)
  process.nextTick(function () {
    module(seq, function (e) {
      seq.end()
      cb(e)
    })
  }) 
  return seq
}

module.exports = occupy
