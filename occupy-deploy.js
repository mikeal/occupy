var request = require('request')

function deploy (seq, cb) {
  uname(seq, function (e) {
    if (e) return cb(e)
    buildtools(seq, function (e) {
      return cb(e)
    })
  })
}
module.exports = deploy

function pack (dir) {
  return tarpack.pack(fstream(dir))
}

function packCrypto (dir, secret) {
  var p = pack(dir)
    , c = crypto.createCipher('aes192', secret)
    ;
  p.pipe(c)
  return c
}
