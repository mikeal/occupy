var server = require('./server')
  , deploy = require('./deployer')
  ;

module.exports = function () { return server.apply(server, arguments) }
module.exports.push = deploy.push
