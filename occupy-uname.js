function uname (seq, cb) {
  if (!seq.uname) {
    seq('uname -a', function (e, stdout) {
      if (e) return cb(e)
      seq.uname = stdout
      cb(null, stdout)
    })
  } else {
    cb(null, seq.uname)
  }
}

module.exports = uname
