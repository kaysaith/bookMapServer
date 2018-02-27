const express = require('express')
const app = express()



app.post('/test', multipartMiddleware, function(req, res){
  console.log('shit')
});

const server = app.listen(9999, function () {

  const host = server.address().address
  const port = server.address().port

  console.log("应用实例，访问地址为 http://%s:%s", host, port)

})



















