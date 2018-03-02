/*
 * @author kaySaith
 * @description
 * 操作数据库的方法
 */

const mysql = require('mysql')


/*—————— 插入数据库图书信息 ——————*/

const connection = mysql.createConnection({
  host: 'bookmapdatabase.cyre2kavvrg6.ap-northeast-1.rds.amazonaws.com',
  user: 'blinkadmin',
  password: 'blink140606',
  port: '3306',
  database: 'bookMapDB',
})

exports.setBooks = function (params = {
  isModifyEvent: Boolean,
  name: String,
  tag: String,
  row: Number,
  columnIndex: Number,
  cover: String,
  shelfID: String,
  time: String,
  bookID: Number
}, callback) {
  let sql = params.isModifyEvent
    ? 'UPDATE book SET Name = ?, Tag = ?, Row = ?, ColumnIndex = ?, Cover = ?, ShelfID = ?, UpdateTime = ? WHERE ID = ?'
    : 'INSERT INTO book(Name, Tag, Row, ColumnIndex, Cover, ShelfID, CreateTime) VALUES(?,?,?,?,?,?,?)'

  let parameters = params.isModifyEvent
    ? [params.name, params.tag, params.row, params.columnIndex, params.cover, params.shelfID, params.time, params.bookID]
    : [params.name, params.tag, params.row, params.columnIndex, params.cover, params.shelfID, params.time]

  // 根据条件插入数据到 `Book` 表格
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) { if (typeof callback === 'function') callback() }
  })
}

/*—————— 注册 ——————*/
exports.registerOrLogin = function (openid, callback) {
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

exports.registerUser = function (params = {
  openid: String,
  nick: String,
  avatar: String,
  token: String,
  time: String,
  callback: Function
}) {
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

exports.getBooksFromDatabase = function (shelfID, startIndex, hold) {
  const sql = 'select * from book where ShelfID = ? order by ID desc limit ?,10'
  const parameters = [shelfID, parseInt(startIndex)]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result)
    }
  })
}

exports.getBookInfoFromDatabase = function (bookID, hold) {
  const sql = 'select * from book where ID = ?'
  const parameters = [bookID]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result[0])
    }
  })
}

exports.getMemberUserIDList= function (shelfID, hold) {
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

exports.getMemberInfoList = function (userIDList, hold) {
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

exports.getShelfID = function (openid, hold) {
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

exports.getUserInfo = function (token, hold) {
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

exports.createShelf = function (param = {
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