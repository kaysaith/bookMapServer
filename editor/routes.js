const express = require('express')
const app = express()

const multiparty = require('connect-multiparty')
const nodeRequest = require('request')
const utils = require('../common/utils')
const mysql = require('../common/mysql')

const path = require('path')

const https = require('https')
const fileStream = require('fs')

const options = {
  key: fileStream.readFileSync('./certs/naonaolaKey.key'),
  cert: fileStream.readFileSync('./certs/naonaolaCrt.crt')
}

https.createServer(options, app).listen(8888, function () {
  console.log('Https server listening on port ' + 8888)
})

/* —————— 业务接口 —————— */

app.post('/upload', multiparty(), function (req, res) {
  const filepath = req.files.file.path
  utils.uploadImageToQiNiu(filepath, (imageUrl) => {
    res.end(imageUrl)
  })
})

app.get('/createBook', function (request, response) {
  const time = new Date()
  mysql.setBooks({
    isModifyEvent: false,
    name: request.query.name,
    tag: request.query.tag,
    row: request.query.row,
    columnIndex: request.query.columnIndex,
    cover: request.query.cover,
    shelfID: request.query.shelfID,
    time: time
  }, () => {
    response.end()
  })
})

app.get('/modifyBookInfo', function (request, response) {
  const time = new Date()
  mysql.setBooks({
    isModifyEvent: true,
    name: request.query.name,
    tag: request.query.tag,
    row: request.query.row,
    columnIndex: request.query.columnIndex,
    cover: request.query.cover,
    shelfID: request.query.shelfID,
    time: time,
    bookID: request.query.bookID
  }, () => {
    response.end()
  })
})

/*—————— 获取 Token ——————*/

const appSecret = 'a734564d0851aec3116df949f6bc26ff'
const appID = 'wx7988f8690d25aa8b'

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

        mysql.registerOrLogin(userInfo.openid, (result) => {
          // 如果结果的长度为 0 意味着此 `openid` 没有注册过,启动注册
          if (result.length === 0) {
            const time = new Date()
            mysql.registerUser({
              openid: userInfo.openid,
              nick: request.query.nickName,
              avatar: request.query.avatarUrl,
              token: uniqueToken,
              time: time,
              callback: () => {
                // 注册成功后直接帮助创建唯一的个人书柜
                mysql.createShelf({
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
            mysql.getShelfID(userInfo.openid, (shelfID) => {
              account.shelfID = shelfID
              res.end(JSON.stringify(account))
            })
          }
        })
      }
    })
})

app.get('/getBooks', function (request, response) {
  mysql.getBooksFromDatabase(request.query.shelfID, request.query.startIndex, (books) => {
    response.end(JSON.stringify(books))
  })
})

app.get('/updateTargetBookInfo', function (request, response) {
  mysql.getBookInfoFromDatabase(request.query.bookID, (book) => {
    response.end(JSON.stringify(book))
  })
})

app.get('/deleteBook', function (request, response) {
  mysql.deleteBook(request.query.bookID, () => {
    response.end()
  })
})

/*—————— 家庭成员列表管理 ——————*/

app.get('/addMember', function (request, response) {
  const time = new Date()
  mysql.createShelf({
    id: request.query.shelfID,
    time: time,
    userID: request.query.memberID,
    isOwner: false
  }, () => {
    response.end('success')
  })
})

app.get('/getMemberList', function (request, response) {
  mysql.getMemberUserIDList(request.query.shelfID,
    (userIDList) => mysql.getMemberInfoList(userIDList,
      (userInfoList) => response.end(JSON.stringify(userInfoList))
    )
  )
})

app.get('/deleteMember', function (request, response) {
  mysql.deleteMember(request.query.openid, () => {
    response.end()
  })
})

app.get('/searchBook', function (request, response) {
  mysql.searchBook(request.query.keyword, request.query.shelfID, (result) => {
    response.end(JSON.stringify(result))
  })
})


















