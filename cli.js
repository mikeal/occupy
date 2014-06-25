#!/usr/bin/env node

var occupy = require('./')
  , path = require('path')
  , url = process.argv[2]
  , base = process.env.PWD
  , requirein = require('requirein')
  ;

// TODO: check package.json for some shit.

var builtins =
  { deploy: require('./occupy-deploy')
  , uname: require('./occupy-uname')
  , 'install-node': require('./occupy-install-node')
  , 'force-install-node': require('./occupy-install-node').force
  }

function tryimport (str) {
  try { return requirein(base, str) }
  catch(e) { return null }
}

function get (name) {
  if (builtins[name]) return builtins[name]
  var trys =
    [ './occupy-'+name
    , 'occupy-'+name
    , name
    ]
  while (trys.length) {
    var t = trys.shift()
    if (tryimport(t)) return tryimport(t)
  }
  return null
}

var command = process.argv[3]
if (!command) throw new Error('You forgot to give me a command :)')
var commandModule = get(command)
if (!commandModule) throw new Error('Cannot find module for command: '+command)

var seq = occupy(url, commandModule, function (e) {
  if (e) throw e
})
seq.onCall = function (s) {
  s.pipe(process.stdout)
}
