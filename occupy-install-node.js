var request = require('request')
  , once = require('once')
  , uname = require('./occupy-uname')
  ;

function buildtools (seq, cb) {
  var aptDeps = ['build-essential', 'openssl', 'libssl-dev', 'pkg-config', 'curl']
    , aptCmd = 'apt-get -y --fix-missing install ' + aptDeps.join(' ')
    , yumDeps = ['gcc-c++', 'make', 'openssl-devel', 'curl']
    , yumCmd = cmd = 'yum -y install ' + yumDeps.join(' ')
    ;
  uname(seq, function (e, _uname) {
    if (_uname.indexOf('Linux') !== -1) {
      seq('apt-get --help', function (e) {
        if (!e) return seq(aptCmd, cb)
        seq('yum --help', function (e) {
          if (e) return cb(new Error('This Linux does not have apt or yum!'))
          return seq(yumCmd, cb)
        })
      })
    } else {
      console.error('Do not know how to install on this operating system.')
      return cb(e)
    }
  })
}

function nodeInstallSteps (version) {
  var url = "http://nodejs.org/dist/" + version + "/node-" + version + ".tar.gz"
    , cd = 'cd node-' + version + ' && '
    , steps =
      [ 'curl '+url+' | tar -zxf -'
      , cd + './configure'
      , cd + 'make'
      , cd + 'make install'
      , 'rm -rf node-'+version
      , 'node --version'
      ]
    ;
  return steps
}

function downloadAndCompile (seq, cb) {
  request('http://nodejs.org/dist/latest/SHASUMS.txt', function (e, resp, txt) {
    if (e) return cb(e)
    if (resp.statusCode !== 200) return cb(new Error('Could not get SHASUMS.'))
    var line = txt.split('\n')[0]
      , i = line.indexOf('node-v') + 'node-'.length
      , version = line.slice(i, line.indexOf('-', i+5))
      , steps = nodeInstallSteps(version)
      ;
    console.log('Stable release of node is '+version)
    var s = seq()
    s.on('error', cb)
    s.on('end', function () {
      console.log('Installed node', version)
      cb()
    })
    steps.forEach(function (step) {
      s.write(step)
    })
    s.on('cmd', console.log)
    s.end()
  })
}

function install (seq, cb) {
  cb = once(cb)
  buildtools(seq, function (e) {
    if (e) return cb(e)
    downloadAndCompile(seq, cb)
  })
}

function installnode (seq, cb) {
  seq('node --version', function (e, stdout) {
    if (e) return install(seq, cb)
    console.log('Has node '+stdout)
    cb(null)
  })
}

module.exports = installnode
module.exports.force = install
