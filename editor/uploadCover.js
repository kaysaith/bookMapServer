/*
 * @author KaySaith
 * @description 本地图片上传到七牛的接口 
 * [upload] 接口路由地址, [method] POST
 */

const qiniu = require('qn')
const fileStream = require('fs')
const express = require('express')
const app = express()
const multiparty = require('connect-multiparty')

const mysql = require('mysql')

const client = qiniu.create({
  accessKey: 'Xcb7vk6Sh9BGN1dXQNIKuPTHJD_2lV-IFBjkkXp6',
  secretKey: 'yUv1DpLWmBanuuY-mgA6Iod0uwiFy4mr-J9aMFIV',
  bucket: 'bookmap',
  origin: 'http://p4qye2peb.bkt.clouddn.com/',
  uploadURL: 'http://up-z2.qiniu.com'
})

function uploadImageToQiNiu (imagePath, callback) {
  client.upload(fileStream.createReadStream(imagePath), function (err, result) {
    console.log(result)
    if (typeof callback === 'function') {
      callback(result.url)
    }
  })
}

app.post('/upload', multiparty(), function (req, res) {
  const filepath = req.files.file.path
  uploadImageToQiNiu(filepath, (imageUrl) => {
    res.end(imageUrl)
  })
})

/*—————— 插入数据库图书信息 ——————*/

const connection = mysql.createConnection({
  host: 'bookmapdatabase.cyre2kavvrg6.ap-northeast-1.rds.amazonaws.com',
  user: 'blinkadmin',
  password: 'blink140606',
  port: '3306',
  database: 'bookMapDB',
})

function createBooks (name, tag, cover, row, columnIndex, callback) {
  connection.connect()
  const sql = 'INSERT INTO books(Name,Tag,Row,ColumnIndex,Cover) VALUES(?,?,?,?,?)'
  const parameters = [name, tag, cover, row, columnIndex]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof callback === 'function') callback()
    }
  })
  connection.end()
}

app.get('/createBook', function (request, response) {
  if (request.url !== '/favicon.ico') {
    createBooks(
      request.query.name,
      request.query.tag,
      request.query.cover,
      request.query.row,
      request.query.columnIndex,
      () => {
        response.end()
        response.send(200)
      }
    )
  }
})

const server = app.listen(8888, function () {
  const host = server.address().address
  const port = server.address().port
  console.log('应用实例，访问地址为 http://%s:%s', host, port)
})



















