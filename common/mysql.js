const mysql = require('mysql')
const express = require('express')
const app = express()

const connection = mysql.createConnection({
  host: 'bookmapdatabase.cyre2kavvrg6.ap-northeast-1.rds.amazonaws.com',
  user: 'blinkadmin',
  password: 'blink140606',
  port: '3306',
  database: 'bookMapDB',
})

connection.connect()

exports.createBooks = function ( params = {
  name: String,
  tag: String,
  row: Number,
  columnIndex: Number,
  cover: String
}) {
  const sql = 'INSERT INTO books(Name,Tag,Row,ColumnIndex,Cover) VALUES(?,?,?,?,?)'
  const parameters = [params.name, params.tag, params.row, params.columnIndex, params.cover]
  //查
  connection.query(sql, parameters, function (err) {
    if (err) console.log('[SELECT ERROR] - ', err.message)
  })
  connection.end()
}

















