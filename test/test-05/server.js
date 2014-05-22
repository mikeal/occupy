var http = require('http')

http.createServer(function (req, res) {
  res.statusCode = 200
  res.setHeader('content-type', 'text/plain')
  res.write('Hello World.')
  res.end()
}).listen(process.env.PORT || 8080, function () {
  console.log('listening.')
})
