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
const utils = require('../common/utils')

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
  shelfID: String,
  time: String }, callback
  ) {
  const sql = 'INSERT INTO book(Name, Tag, Row, ColumnIndex, Cover, ShelfID, CreateTime) VALUES(?,?,?,?,?,?,?)'
  const parameters = [params.name, params.tag, params.row, params.columnIndex, params.cover, params.shelfID, params.time]
  // 根据条件插入数据到 `Book` 表格
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) { if (typeof callback === 'function') callback() }
  })
}

app.get('/createBook', function (request, response) {
  if (request.url !== '/favicon.ico') {
    const time = new Date()
    getShelfID(request.query.openid, (shelfID) => {
      createBooks({
        name: request.query.name,
        tag: request.query.tag,
        row: request.query.row,
        columnIndex: request.query.columnIndex,
        cover: request.query.cover,
        shelfID: shelfID,
        time: time
      }, () => {
        response.end()
      })
    })
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

        const uniqueToken = utils.initUserToken(userInfo.openid)

        const account = {
          openid: userInfo.openid,
          token: uniqueToken,
        }

        registerOrLogin(userInfo.openid, (result) => {
          // 如果结果的长度为 0 意味着此 `openid` 没有注册过,启动注册
          if (result.length === 0) {
            const time = new Date()
            registerUser({
              openid: userInfo.openid,
              nick: request.query.nickName,
              avatar: request.query.avatarUrl,
              token: uniqueToken,
              time: time,
              callback: () => {
                // 注册成功后直接帮助创建唯一的个人书柜
                createShelf({
                  id: userInfo.openid,
                  time: time,
                  userID: userInfo.openid,
                  isOwner: true
                }, () => {
                  account.shelfID = shelfID
                  res.end(JSON.stringify(account))
                })
              }
            })
          } else {
            // 如果是登录用户查询这个用户的 `ShelfID` 并返回给客户端
            getShelfID(userInfo.openid, (shelfID) => {
              account.shelfID = shelfID
              res.end(JSON.stringify(account))
            })
          }
        })
      }
    })
})

function registerOrLogin (openid, callback) {
  const sql = 'select Nick from user where OpenID = ?'
  const parameters = [openid]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof callback === 'function') callback(result)
    }
  })
}

function registerUser (params = {
  openid: String,
  nick: String,
  avatar: String,
  token: String,
  time: String,
  callback: Function }
  ) {
  const sql = 'INSERT INTO user(OpenID, Nick, Avatar, Token, RegisterTime) VALUES(?,?,?,?,?)'
  const parameters = [params.openid, params.nick, params.avatar, params.token, params.time]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof params.callback === 'function') params.callback()
    }
  })
}

function updateUserInfo () {
  //TODO 这里要写一个函数在用户登录的时候判断是否需要更新他的新的微信的用户名或头像
}

/*—————— Get Books ——————*/

app.get('/getBooks', function (request, response) {
  getBooksFromDatabase(request.query.openid, request.query.startIndex, (books) => {
    response.end(JSON.stringify(books))
  })
})

function getBooksFromDatabase(openid, startIndex, hold) {
  getShelfID(openid, (shelfID) => {
    const sql = 'select * from book where ShelfID = ? order by ID desc limit ?,10'
    const parameters = [shelfID, parseInt(startIndex)]
    // 根据条件插入数据
    connection.query(sql, parameters, function (err, result) {
      if (err) console.log('[SELECT ERROR] - ', err.message)
      if (result) {
        if (typeof hold === 'function') hold(result)
      }
    })
  })
}

/*—————— 添加家庭成员 ——————*/

app.get('/addMember', function (request, response) {
  const time = new Date()
  createShelf({
    id: request.query.shelfID,
    time: time,
    userID: request.query.memberID,
    isOwner: false
  }, () => {
    response.end('success')
  })
})

/*—————— 家庭成员列表 ——————*/

app.get('/getMemberList', function (request, response) {
  getMemberUserIDList(request.query.shelfID,
    (userIDList) => getMemberInfoList(userIDList,
      (userInfoList) => response.end(JSON.stringify(userInfoList))
    )
  )
})

function getMemberUserIDList (shelfID, hold) {
  const sql = 'select OpenID from shelf where ShelfID = ?'
  const parameters = [shelfID]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result)
    }
  })
}

function getMemberInfoList (userIDList, hold) {
  let allUserID = ''
  for (let index = 0; index < userIDList.length; index++) {
    allUserID += index < userIDList.length - 1
      ? 'OpenID = "' + userIDList[index].OpenID + '" or '
      : 'OpenID = "' + userIDList[index].OpenID + '"'
  }
  const sql = 'select * from user where ' + allUserID
  // 根据条件插入数据
  connection.query(sql, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result)
    }
  })
}


/* 数据库策略模式组件 */

function getShelfID (openid, hold) {
  const sql = 'select ShelfID from shelf where OpenID = ? and IsOwner = 1'
  const parameters = [openid]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      let shelfID
      for (const item in result[0]) {
        shelfID = result[0][item]
      }
      if (typeof hold === 'function') hold(shelfID)
    }
  })
}

function getUserInfo (token, hold) {
  const sql = 'select * from user where Token = ?'
  const parameters = [token]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      let openid
      for (const item in result[0]) {
        openid = result[0][item]
      }
      if (typeof hold === 'function') hold(openid)
    }
  })
}

function createShelf (param = {
  id: String,
  time: String,
  userID: String,
  isOwner: Boolean }, callback
) {
  const sql = 'INSERT INTO shelf(ShelfID, CreateTime, OpenID, IsOwner) VALUES(?,?,?,?)'
  const parameters = [param.id, param.time, param.userID, param.isOwner]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof callback === 'function') callback()
    }
  })
}


// 指定接口监听

const server = app.listen(8888, function () {
  const host = server.address().address
  const port = server.address().port
  console.log('应用实例，访问地址为 http://%s:%s', host, port)
})



















