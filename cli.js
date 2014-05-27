#!/usr/bin/env node

var client = require('./client')
  , path = require('path')
  , url = process.argv[2]
  , base = process.env.PWD
  ;

client(base, url, function (e, resp) {
  if (e) throw e
  resp.pipe(process.stdout)
})
