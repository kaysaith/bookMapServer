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
const nodeRequest = require('request')

const client = qiniu.create({
  accessKey: 'Xcb7vk6Sh9BGN1dXQNIKuPTHJD_2lV-IFBjkkXp6',
  secretKey: 'yUv1DpLWmBanuuY-mgA6Iod0uwiFy4mr-J9aMFIV',
  bucket: 'bookmap',
  origin: 'http://p4qye2peb.bkt.clouddn.com/',
  uploadURL: 'http://up-z2.qiniu.com'
})

function uploadImageToQiNiu (imagePath, callback) {
  client.upload(fileStream.createReadStream(imagePath), function (err, result) {
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

function createBooks (params = {
  name: String,
  tag: String,
  row: Number,
  columnIndex: Number,
  cover: String,
  callback: Function },
  ) {
  connection.connect()
  const sql = 'INSERT INTO books(Name, Tag, Row, ColumnIndex, Cover) VALUES(?,?,?,?,?)'
  const parameters = [params.name, params.tag, params.row, params.columnIndex, params.cover]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) { if (typeof params.callback === 'function') params.callback() }
  })
  connection.end()
}

app.get('/createBook', function (request, response) {
  if (request.url !== '/favicon.ico') {
    createBooks(
      request.query.name,
      request.query.tag,
      request.query.row,
      request.query.columnIndex,
      request.query.cover,
      () => {
        response.end()
        response.send(200)
      }
    )
  }
})

/*—————— 获取 Token ——————*/

const appSecret = 'a734564d0851aec3116df949f6bc26ff'
const appID = 'wx7988f8690d25aa8b'

/*
 * @author KaySaith
 * @description
 * 请求 `token` 并且获取用户信息的函数
 * `api router` [/getTokenAndUserInfo]
 * `parameters`
 *  {
 *    code: String,
 *    nickName: String,
 *    avatarUrl: String
 *  }
 */

app.get('/getTokenAndUserInfo', function (request, res) {
  const weChatHeader = 'https://api.weixin.qq.com/sns/jscode2session?'
  nodeRequest(
    weChatHeader + 'appid=' + appID + '&secret=' + appSecret + '&js_code=' + request.query.code + '&grant_type=authorization_code',
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        /* 0 是 `session_key` 1 是 `openid`
         * 不知道为什么微信返回的是一个看着像对象的纯 `String`, 所以这里需要
         * 把结果转换成可调用的类型. by KaySaith
         */
        const userInfo = {}
        for (const item in JSON.parse(body)) {
          userInfo[item] = JSON.parse(body)[item]
        }

        registerOrLogin(userInfo.openid, (result) => {
          if (result.length === 0) {
            const uniqueToken = initUserToken(userInfo.openid)
            // 如果结果的长度为 0 意味着此 `openid` 没有注册过,启动注册
            const time = new Date()
            registerUser(userInfo.openid, request.query.nickName, request.query.avatarUrl, uniqueToken, time)
          }
        })
        res.end(body)
      }
    })
})

function registerOrLogin (openid, callback) {
  const sql = 'select Nick from user where WxOpenID = ?'
  const parameters = [openid]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof callback === 'function') callback(result)
    }
  })
}

function registerUser (openid, nick, avatar, token, time, callback) {
  const sql = 'INSERT INTO user(WxOpenID, Nick, Avatar, Token, RegisterTime) VALUES(?,?,?,?,?)'
  const parameters = [openid, nick, avatar, token, time]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) { if (typeof callback === 'function') callback() }
  })
}

function updateUserInfo () {
  //TODO 这里要写一个函数在用户登录的时候判断是否需要更新他的新的微信的用户名或头像
}

// 通过用户的唯一 `ID` 生成服务器私密请求校验的 `token`
function initUserToken (openid) {
  const uuidv4 = require('uuid/v4')
  return openid + uuidv4()
}

// 指定接口监听

const server = app.listen(8888, function () {
  const host = server.address().address
  const port = server.address().port
  console.log('应用实例，访问地址为 http://%s:%s', host, port)
})



















