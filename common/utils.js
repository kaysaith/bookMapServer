/*
 * @author kaySaith
 * @description
 * 常用工具
 */

// 通过用户的唯一 `ID` 生成服务器私密请求校验的 `token`
exports.initUserToken =  function(openid) {
  const uuidv4 = require('uuid/v4')
  return openid + uuidv4()
}


