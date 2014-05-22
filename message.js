var colors = require('colors')

function format (str, color) {
  return color && str[color] ? str[color] : str
}

module.exports = function (stream) {
  var ended = false
  function ret () {
    var str = format(Array.prototype.slice.apply(arguments).join(' ')+'\n')
    ret.write(str)
    process.stdout.write(str)
  }
  ret.res = stream
  ret.log = ret
  ret.warn = function () {
    var str = format(Array.prototype.slice.apply(arguments).join(' ')+'\n', 'orange')
    ret.write(str)
    process.stdout.write(str)
  }
  ret.error = function () {
    var str = format(Array.prototype.slice.apply(arguments).join(' ')+'\n', 'red')
    ret.write(str)
    console.log(str)
    process.stderr.write(str)
  }
  ret.write = function (chunk) {
    if (!ended) {
      try {
        ret.res.write(chunk)
      } catch (e) {
        ended = true
      }
    }
  }
  return ret
}
