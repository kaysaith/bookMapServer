/*
 * @author kaySaith
 * @description
 * 常用工具
 */

const qiniu = require('qn')
const fileStream = require('fs')

// 通过用户的唯一 `ID` 生成服务器私密请求校验的 `token`
exports.initUserToken =  function(openid) {
  const uuidv4 = require('uuid/v4')
  return openid + uuidv4()
}

const client = qiniu.create({
  accessKey: 'Xcb7vk6Sh9BGN1dXQNIKuPTHJD_2lV-IFBjkkXp6',
  secretKey: 'yUv1DpLWmBanuuY-mgA6Iod0uwiFy4mr-J9aMFIV',
  bucket: 'bookmap',
  origin: 'http://p4qye2peb.bkt.clouddn.com/',
  uploadURL: 'http://up-z2.qiniu.com'
})

exports.uploadImageToQiNiu = function (imagePath, callback) {
  client.upload(fileStream.createReadStream(imagePath), function (err, result) {
    if (typeof callback === 'function') {
      callback(result.url)
    }
  })
}

