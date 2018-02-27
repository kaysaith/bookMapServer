/*
 * @author KaySaith
 * @description 本地图片上传到七牛的接口 
 * [upload] 接口路由地址, [method] POST
 */


const qiniu = require('qn')
const fileStream = require("fs")
const express = require('express')
const app = express()
const multiparty = require('connect-multiparty')
const multipartMiddleware = multiparty()

const mysql = require('../common/mysql.js')

const client = qiniu.create({
  accessKey: 'Xcb7vk6Sh9BGN1dXQNIKuPTHJD_2lV-IFBjkkXp6',
  secretKey: 'yUv1DpLWmBanuuY-mgA6Iod0uwiFy4mr-J9aMFIV',
  bucket: 'bookmap',
  origin: 'http://p4qye2peb.bkt.clouddn.com/',
  uploadURL: 'http://up-z2.qiniu.com'
});

function uploadImageToQiNiu(imagePath, callback) {
  client.upload(fileStream.createReadStream(imagePath), function (err, result) {
    console.log(result);
    if (typeof callback === 'function') {
      callback(result.url)
    }
  })
}

app.get('/createBook', function(request, response) {
  if(request.url !== "/favicon.ico") {
    mysql.createBooks({
      name: request.query.name,
      tag: request.query.tag,
      cover: request.query.cover,
      row: request.query.row,
      columnIndex: request.query.columnIndex
    }, () => {
      response.end('isSuccess')
    })
  }
})

app.post('/upload', multipartMiddleware, function(req, res){
  const filepath = req.files.file.path
  uploadImageToQiNiu(filepath, (imageUrl) => {
    res.end(imageUrl)
  })
});

const server = app.listen(8888, function () {

  const host = server.address().address
  const port = server.address().port
  console.log("应用实例，访问地址为 http://%s:%s", host, port)

})



















