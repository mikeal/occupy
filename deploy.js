var tarpack = require('tar-pack')
  , fstream = require('fstream-npm')
  , path = require('path')
  , fs = require('fs')
  , child = require('child_process')
  , once = require('once')
  , clone = require('lodash.clone')
  , defaults = require('lodash.defaults')
  , child_process = require('child_process')
  , crypto = require('crypto')
  , empty = require('empty-port')
  , limit = require('simple-rate-limiter')
  , isUp = require('./tcp-up')
  , events = require('events')
  ;

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

function unpack (dir, cb) {
  return tarpack.unpack(dir, cb)
}

function unpackCrypto (dir, secret, cb) {
  var c = crypto.createDecipher('aes192', secret)
    , p = unpack(dir, cb)
    ;
  c.pipe(p)
  return c
}

exports.pack = pack
exports.unpack = unpack
exports.packCrypto = packCrypto
exports.unpackCrypto = unpackCrypto

function run (dir, stream, msg, cb) {
  var pkgroot = dir
    , cb = once(cb)
    ;

  try {
    var pkg = fs.readFileSync(path.join(dir, 'package.json'))
  } catch(e) {
    msg("No package.json found.")
    return cb(new Error('No package.json'))
  }

  var startScript = pkg.scripts && pkg.scripts.start ? pkg.scripts.start : 'node server.js'
    , startBin = startScript.split(' ')[0]
    , startOpts = startScript.split(' ').slice(1)
    ;

  function exec (cmd, args, opts, cb) {
    if (!cb) {
      cb = opts
      opts = {}
    }
    cb = once(cb)
    opts.cwd = pkgroot
    opts.detached = false
    if (opts.env) {
      opts.env = defaults(opts.env, process.env)
    }
    msg('Spawning', JSON.stringify(cmd + ' ' + args.join(' ')))
    var s = child_process.spawn(cmd, args, opts)

    s.stdout.on('data', function (chunk) {
      msg.write(chunk)
    })
    s.stderr.on('data', function (chunk) {
      msg.write(chunk.toString().error)
    })
    s.on('error', cb)
    s.on('close', function (code) {
      msg('Process', JSON.stringify(cmd + ' ' + args.join(' ')), 'exited with code', code)
      if (!code) {
        cb(null)
      } else {
        if (!s.ignoreExit) {
          msg.error('Exit code was not zero.')
          cb(new Error('Exit code was not zero'))
        }
      }
    })
    return s
  }

  var state = new events.EventEmitter()

  function _restart () {
    var _port = state.port
    state.port = null
    empty({ startPort: state.port || 5555 }, function (e, port) {
      var process = exec(startBin, startOpts, {env:{PORT:port}}, function (e) {
        if (e && process.respawn) return restart()
      })
      process.respawn = true
      isUp(port, function (e) {
        state.port = port
        state.process = process
        state.kill = function () {
          state.process.respawn = false
          state.process.ignoreExit = true
          state.process.kill('SIGINT')
        }
        cb(null, state)
        state.emit('release')
      })
    })
  }
  var restart = limit(_restart).to(10).per(1000 * 60)

  function _test () {
    exec('npm', ['test'], function (e) {
      if (e) return cb(e)
      restart()
    })
  }

  exec('npm', ['rebuild'], function (e) {
    if (e) return cb(e)
    _test()
  })
}

exports.run = run

function push (dir, endpoint, cb) {
  var r = request.put(endpoint, {'user-agent':'occupy-0.0.1'})
  pack(dir).pipe(r)
  return r
}
