var debug = require('debug')('course-elector-server:tokenController');
var statusCode = require('../variables').statusCode;
var signature = require('../variables').signature;
var querystring = require('querystring');
var jwt = require('jsonwebtoken');

var tokenController = {
	// 参数：
	// 		userId 用户在数据库中的_id
	// 作用：
	//		使用userId产生一个token
	// 返回：
	// 		Promise:
	//			resolve(token)
	getToken: function getToken (userId) {
		debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return new Promise(function (resolve) {
			jwt.sign({ userId: userId }, signature, {expiresIn: '7 days'}, function (token) {
				resolve(token);
			});
		});
	},
	// 参数：
	// 		token 用户令牌
	// 作用：
	//		检查token是否合法，如果合法则返回resolve并提取其中的userId,非法返回reject
	// 返回：
	// 		Promise:
	//			resolve(userId)
	//			reject(statusCode)
	verify: function verify (token) {
		debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return new Promise(function (resolve, reject) {
			jwt.verify(token, signature, function (err, decoded) {
				if (err) {
					if (err.name == 'TokenExpiredError') {
                        reject(statusCode.token_expired);
                    } else {
                        reject(statusCode.invalid_token);
                    }
				} else {
					resolve(decoded.userId);
				}
			});
		});
	}
};

module.exports = tokenController;
