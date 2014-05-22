var server = require('./server')
  , deploy = require('./deploy')
  ;

module.exports = function () { return server.apply(server, arguments) }
module.exports.push = deploy.push
