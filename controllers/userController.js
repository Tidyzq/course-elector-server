var debug = require('debug')('course-elector-server:userController');
var http = require('http');
var ObjectID = require('mongodb').ObjectID;
var statusCode = require('../variables').statusCode;
var querystring = require('querystring');
var python = require('python-shell');

module.exports = function (db) {
	var userCollection = db.collection('users');

	// 参数：
	// 		userId 用户在数据库中的_id
	// 作用：
	//		在数据库中查找对应userId的用户
	// 返回：
	// 		Promise:
	//			resolve(foundUser)
	//			reject()
	function getUserById (userId) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return new Promise(function (resolve, reject) {
			var id = ObjectID(userId);
			userCollection.findOne({'_id': id}).then(function (foundUser) {
				foundUser ? resolve(foundUser) : reject();
			});
		});
	}

	// 参数：
	// 		username 用户的学号
	// 作用：
	//		在数据库中查找对应username的用户
	// 返回：
	// 		Promise:
	//			resolve(foundUser)
	//			reject()
	function getUserByName (username) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return new Promise(function (resolve, reject) {
			userCollection.findOne({username: username}).then(function (foundUser) {
				foundUser ? resolve(foundUser) : reject();
			});
		});
	}

	// 参数：
	// 		username 用户的学号
	// 		password 用户的教务系统密码
	// 作用：
	//		尝试登陆教务系统，如果登陆成功，则返回jsessionid和sid, 当密码错误时返回reject
	// 返回：
	// 		Promise:
	//			resolve({jsessionid, sid})
	//			reject(statusCode)
	function loginToJWXT (username, password) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return new Promise(function (resolve, reject) {
			http.get('http://uems.sysu.edu.cn/elect/index.html?time=' + Date(), function (res) {
			  	var cookie = res.headers['set-cookie'][0];
			  	var jsessionid = /JSESSIONID=([^;]*);/.exec(cookie)[1];
			  	var func = function () {
			  		getCheckCode(jsessionid).then(function (checkcode) {
				  		var postData = querystring.stringify({
						    'username': username,
						    'password': password,
						    'j_code': checkcode
						});
						var options = {
							hostname: 'uems.sysu.edu.cn',
							path: '/elect/login',
							method: 'POST',
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded',
								'Content-Length': postData.length,
								'Cookie': 'JSESSIONID=' + jsessionid
							}
						};
						var req = http.request(options, function (res) {
							res.setEncoding('utf8');
							if (res.statusCode == 500) {
								var body = [];
								res.on('data', function (html) {
									body.push(html);
								}).on('end', function () {
									var a = /if \('([^']*)' != '([^']*)'\)/.exec(body.join())[1];
									debug('info:' + a);
									switch (a) {
									case "": // 用户不存在或密码错误
										debug('invalid password');
										reject(statusCode['invalid password']);
										break;
									case "验证码错误": // 重新登陆
										debug('invalid checkcode');
										func();
										break;
									default:
										debug('Got error:', a);
									}
								});
							} else {
								var location = res.headers.location;
								var sid = /sid=(\S*)/.exec(location)[1];
								resolve({ jsessionid: jsessionid, sid: sid });
							}
						});

						// write data to request body
						req.write(postData);
						req.end();
				  	});
				};
				func();
			});
		})
	}

	// 参数：
	// 		username 用户的学号
	// 		password 用户在教务系统的密码
	// 		jsessionid 教务系http统登陆的sessionid
	// 		sid 教务系统登陆后的学生代号
	// 作用：
	//		在数据库中更新或创建学生信息，如果数据库中已存在对应学号项目，则更新，否则创建。最后返回该学生在数据库中的_id
	// 返回：
	// 		Promise:
	//			resolve(userId)
	function updateUser (username, password, jsessionid, sid) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return getUserByName(username).then(function (foundUser) {
			return userCollection.update({'_id': foundUser._id}, {$set: {password: password, jsessionid: jsessionid, sid: sid}}).then(function () {
				return Promise.resolve(foundUser._id);
			});
		}, function () {
			var user = {
				username: username,
				password: password,
				jsessionid: jsessionid,
				sid: sid
			};
			return userCollection.insert(user).then(function(resultArr) {
				var userId = resultArr.insertedIds[1];
				return Promise.resolve(userId);
			});
		});
	}

	// 参数：
	// 		jsessionid 教务系统登陆的sessionid
	// 		sid 教务系统登陆后的学生代号
	// 作用：
	//		检查jsessionid和sid是否可用，如果可用，则返回resolve，否则reject
	// 返回：
	// 		Promise:
	//			resolve()
	//			reject()
	function verifyLoginInfo (jsessionid, sid) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		var query = querystring.stringify({sid: sid});
		var options = {
		    host: 'uems.sysu.edu.cn',
		    path: '/elect/s/types?' + query,
		    method: 'GET',
		    headers: {
		      	Cookie: 'JSESSIONID=' + jsessionid,
		      	Connection: 'keep-alive'
		    }
	  	};
		return new Promise(function (resolve, reject) {
			var req = http.request(options, function (res) {
				debug(res.statusCode);
				res.statusCode != 500 ? resolve() : reject();
			});
			req.on('error', function (err) {
				debug(err);
			});
			req.end();
		});
	}

	// 参数：
	// 		jsessionid 教务系统登陆的sessionid
	// 作用：
	//		获取验证码并用python脚本自动识别，识别完成返回识别结果
	// 返回：
	// 		Promise:
	//			resolve(result)
	function getCheckCode (jsessionid) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		var options = {
			mode: 'text',
			scriptPath: 'python',
			args: [jsessionid]
		};
		return new Promise(function (resolve, reject) {
			python.run('verify.py', options, function (err, results) {
				if (err) {
					debug(err);
                    reject();
				} else {
					resolve(results[0]);
				}
			});
		});
	}

    return {
		// 参数：
		// 		username 用户的学号
		// 		password 用户在教务系统的密码
		// 作用：
		//		尝试登陆到教务系统，如果登陆成功，则将登陆信息写入数据库并返回userId，否则返回错误码
		// 返回：
		// 		Promise:
		//			resolve(userId)
		//			reject(errCode)
		login: function login (username, password) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
			return loginToJWXT(username, password).then(function (result) {
				return updateUser(username, password, result.jsessionid, result.sid);
			}, function () {
				return Promise.reject(statusCode["invalid password"]);
			});
		},

		// 参数：
		// 		userId 用户的id
		// 作用：
		//		根据userId获取最新的jsessionid和sid
		// 返回：
		// 		Promise:
		//			resolve(jsessionid, sid)
		//			reject(errCode)
		getLoginInfo: function getLoginInfo (userId) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
			return getUserById(userId).then(function (foundUser) {
				return verifyLoginInfo(foundUser.jsessionid, foundUser.sid).then(function () {
					return Promise.resolve({ jsessionid: foundUser.jsessionid, sid: foundUser.sid });
				}, function () {
					return loginToJWXT(foundUser.username, foundUser.password).then(function (result) {
						return updateUser(foundUser.username, foundUser.password, result.jsessionid, result.sid);
					}, function () {
						return Promise.reject(statusCode["invalid password"]);
					});
				});
			});
		}
	};
};