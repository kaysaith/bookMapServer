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
  const sql = 'SELECT Nick FROM user WHERE OpenID = ?'
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
  userID: UserID,
  callback: Function
}) {
  const sql = 'INSERT INTO user(UserID, OpenID, Nick, Avatar, Token, RegisterTime) VALUES(?,?,?,?,?,?)'
  const parameters = [params.userID, params.openid, params.nick, params.avatar, params.token, params.time]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof params.callback === 'function') params.callback()
    }
  })
}

exports.initUserID = function (hold) {
  const sql = 'SELECT UserID FROM user'
  // 根据条件插入数据
  connection.query(sql, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      const newUserID = result[result.length - 1].UserID + Math.floor(Math.random() * 10)
      if (typeof hold === 'function') hold(newUserID)
    }
  })
}

exports.getBooksFromDatabase = function (shelfID, startIndex, hold) {
  const sql = 'SELECT * FROM book WHERE ShelfID = ? ORDER BY ID DESC LIMIT ?,10'
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
  const sql = 'SELECT * FROM book WHERE ID = ?'
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
  const sql = 'SELECT OpenID FROM shelf WHERE ShelfID = ?'
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
  const sql = 'SELECT * FROM user WHERE ' + allUserID
  // 根据条件插入数据
  connection.query(sql, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result)
    }
  })
}

exports.getShelfID = function (openid, hold) {
  const sql = 'SELECT ShelfID FROM shelf WHERE OpenID = ? AND IsOwner = 1'
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

exports.getLoginInfo = function (openid, hold) {
  const sql =
    'SELECT data.*, shelf.ShelfID FROM (SELECT * from user where OpenID = ?) ' +
    'AS data LEFT JOIN shelf ON data.OpenID = shelf.OpenID AND shelf.IsOwner = 1'
  const parameters = [openid]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result)
    }
  })
}

exports.getUserInfo = function (token, hold) {
  const sql = 'SELECT * FROM user WHERE Token = ?'
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

exports.getOpenIdByUserID = function (userID, hold) {
  const sql = 'SELECT OpenID FROM user WHERE UserID = ?'
  const parameters = [userID]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result[0].OpenID)
    }
  })
}

exports.searchBook = function (keyword, shelfID, hold) {
  let splitKeywords = keyword.split(' ')
  let nameSql = ''
  let tagSql = ''

  for (let index = 0; index < splitKeywords.length; index++) {
    if (splitKeywords[index] !== '') {
      if (nameSql == '') {
        nameSql += 'Name LIKE "%' + splitKeywords[index] + '%"'
        tagSql += 'Tag LIKE "%' + splitKeywords[index] + '%"'
      } else {
        nameSql += ' AND Name LIKE "%' + splitKeywords[index] + '%"'
        tagSql += ' AND Tag LIKE "%' + splitKeywords[index] + '%"'
      }
    }
  }
  let sql = 'SELECT * FROM book WHERE ' + nameSql + ' AND ShelfID = "' + shelfID + '" OR ' + tagSql + ' AND ShelfID = "' + shelfID + '"'

  // 根据条件插入数据
  connection.query(sql, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result)
    }
  })
}

exports.deleteBook = function (bookID, callback) {
  // 从家庭列表删除指定的 `OpenID` 以及 判断不是创建者
  const sql = 'DELETE FROM book WHERE ID = ?'
  const parameters = [bookID]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof callback === 'function') callback()
    }
  })
}

exports.deleteMember = function (openid, callback) {
  // 从家庭列表删除指定的 `OpenID` 以及 判断不是创建者
  const sql = 'DELETE FROM shelf WHERE OpenID = ? AND IsOwner = 0'
  const parameters = [openid]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof callback === 'function') callback()
    }
  })
}

// 我被分享的 `Shelf List`

exports.getShelfList = function (openid, hold) {
  // 根据用户的 `openid` 拉取到与此 `openid` 关联的 `ShelfID` 和 `User Nick`
  const sql =
    'SELECT data.OpenID, data.ShelfID, user.Nick FROM (SELECT * FROM shelf WHERE ShelfID = (SELECT ShelfID FROM shelf WHERE OpenID = ? AND IsOwner = 0) AND IsOwner = 1) as data LEFT JOIN user ON data.OpenID = user.OpenID'
  const parameters = [openid]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      console.log(result)
      console.log("__________")
      function prepareBooksInfo (callback) {
        result.forEach((it) => {
          getBooksCount(it.ShelfID, (booksCount) => {
            // 这个异步方法在循环里面添加新字段数据
            it.booksCount = booksCount
            if (it.ShelfID === result[result.length - 1].ShelfID) {
              // 通过数量判断循环完结并执行回调
              if (typeof  callback === 'function') callback(result)
            }
          })
        })
      }

      prepareBooksInfo((bookInfo) => {
        if (typeof hold === 'function') hold(bookInfo)
      })

    }
  })
}

exports.getShelfBooksCount = function (shelfID, hold) {
  getBooksCount(shelfID, hold)
}

function getBooksCount(shelfID, hold) {
  const sql = 'SELECT * FROM book WHERE ShelfID = ?'
  const parameters = [shelfID]
  // 根据条件插入数据
  connection.query(sql, parameters, function (err, result) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
    if (result) {
      if (typeof hold === 'function') hold(result.length)
    }
  })
}