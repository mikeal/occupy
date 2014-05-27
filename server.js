var service = require('./service')
  , path = require('path')
  , fs = require('fs')
  , output = path.join(__dirname, 'deploys')
  ;

try {
  fs.mkdirSync(output)
} catch(e) {
  // already there.
}

service(output).listen(process.env.PORT || 80)
