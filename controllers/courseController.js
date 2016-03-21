var debug = require('debug')('course-elector-server:courseController');
var statusCode = require('../variables').statusCode;
var querystring = require('querystring');
var http = require('http');

// 参数：
// 		jsessionid 教务系http统登陆的sessionid
// 		sid 教务系统登陆后的学生代号
// 作用：
//		获取课程类型，提取其url和名称	
// 返回：
// 		Promise:
//			resolve(courseGroup)
//			reject(errCode)
function getCourseGroupsWithUrl(jsessionid, sid) {
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
			res.setEncoding('utf8');
			if (res.statusCode == 500) {
				reject(statusCode['sid fails']);
			} else {
				var body = [];
				res.on('data', function (chunk) {
					body.push(chunk);
				}).on('end', function () {
					var html = body.join();
					var courseGroup = [];
					var regex = /<td class='c'><a href="([^"]+)">([^<]+)<\/a><\/td>/g;
					for (var match = regex.exec(html); match; match = regex.exec(html)) {
						var group = {
							name: match[2],
							url: match[1]
						};
						courseGroup.push(group);
					}
					resolve(courseGroup);
				});
			}
		});
		req.on('error', function (err) {
			debug(err);
			reject(statusCode['http error']);
		});
		req.end();
	});
}

// 参数：
// 		jsessionid 教务系http统登陆的sessionid
// 		url 课程类型的url
// 作用：
//		获取课程类型中的课程列表	
// 返回：
// 		Promise:
//			resolve(courses)
//			reject(errCode)
function getCoursesByUrl(jsessionid, url) {
    debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
	var options = {
	    host: 'uems.sysu.edu.cn',
	    path: url,
	    method: 'GET',
	    headers: {
	      	Cookie: 'JSESSIONID=' + jsessionid,
	      	Connection: 'keep-alive'
	    }
  	};
	return new Promise(function (resolve, reject) {
		var req = http.request(options, function (res) {
			res.setEncoding('utf8');
			if (res.statusCode == 500) {
				reject(statusCode['sid fails']);
			} else {
				var body = [];
				res.on('data', function (chunk) {
					body.push(chunk);
				}).on('end', function () {
					var html = body.join();
					var courses = [];
					var electedRegex = /<tr class="\w+" >[\n\t]+<td class='c'>[\s\S]*?<\/td>\[\n\t]+<td>([^<]*)<\/td>[\n\t]+<td><a href="javascript:void\(0\)" onclick="courseDet\('(\d*)'[^\)]+\)">([^<]*)<\/a><\/td>[\n\t]+<td>([^<]*)<\/td>[\n\t]+<td class='c w'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>[\n\t]*([^<\n\t]*)[\n\t]*<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c l'>([^<]*)<\/td>[\n\t]+<\/tr>/g;
					for (var match = electedRegex.exec(html); match; match = electedRegex.exec(html)) {
						var electedCourse = {};
						electedCourse.isConflict = false;
						electedCourse.state = (match[1] == "选课成功" ? 2 : 1);
						electedCourse.id = match[2];
						electedCourse.name = match[3];
						electedCourse.timeAndPlace = match[4];
						electedCourse.teacher = match[5];
						electedCourse.score = parseInt(match[6]);
						electedCourse.empty= parseInt(match[9]);
						electedCourse.hitRate = match[10];
						electedCourse.filterStyle = match[14];
						courses.push(electedCourse);
					}
					var elected = courses.length;
					var unelectRegex = /<tr class="\w+ (\w*)" >[\n\t]+<td class='c'>[\s\S]*?<\/td>[\n\t]+<td><a href="javascript:void\(0\)" onclick="courseDet\('(\d*)'\)">([^<]*)<\/a><\/td>[\n\t]+<td>([^<]*)<\/td>[\n\t]+<td class='c w'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c'>[\n\t]*([^<\n\t]*)[\n\t]*<\/td>[\n\t]+<td class='c'>([^<]*)<\/td>[\n\t]+<td class='c l s'>([^<]*)<\/td>[\n\t]+<\/tr>/g;
					for (var unelectedMatch = unelectRegex.exec(html); unelectedMatch; unelectedMatch = unelectRegex.exec(html)) {
						var unelectedCourse = {};
						unelectedCourse.isConflict = unelectedMatch[1] != '';
						unelectedCourse.state = 0;
						unelectedCourse.id = unelectedMatch[2];
						unelectedCourse.name = unelectedMatch[3];
						unelectedCourse.timeAndPlace = unelectedMatch[4];
						unelectedCourse.teacher = unelectedMatch[5];
						unelectedCourse.score = parseInt(unelectedMatch[6]);
						unelectedCourse.empty= parseInt(unelectedMatch[9]);
						unelectedCourse.hitRate = unelectedMatch[10];
						unelectedCourse.filterStyle = unelectedMatch[14];
						courses.push(unelectedCourse);
					}
					resolve({ elected: elected, courses: courses });
				});
			}
		});
		req.on('error', function (err) {
			debug(err);
			reject(statusCode['http error']);
		});
		req.end();
	});
}

var courseController = {
	// 参数：
	// 		jsessionid 教务系http统登陆的sessionid
	// 		url 课程类型的url
	// 作用：
	//		查询课程列表
	// 返回：
	// 		Promise:
	//			resolve(courseGroup)
	//			reject(errCode)
	getCourseList: function getCourseList (jsessionid, sid) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		return new Promise(function (resolve, reject) {
			getCourseGroupsWithUrl(jsessionid, sid).then(function (courseGroup) {
				var counter = 0;
				for (var index = 0; index < courseGroup.length; ++index) {
					(function (index) {
						getCoursesByUrl(jsessionid, courseGroup[index].url).then(function (data) {
							courseGroup[index].elected = data.elected;
							courseGroup[index].courses = data.courses;
							delete courseGroup[index].url;
							if (++counter == courseGroup.length) {
								resolve(courseGroup);
							}
						}, function (errCode) {
							reject(errCode);
						});
					})(index);
				}
			});
		});
	},
	// 参数：
	// 		jsessionid 教务系http统登陆的sessionid
	// 		url 课程类型的url
	//		courseId 课程id
	// 作用：
	//		查询课程详情
	// 返回
	// 		Promise:
	//			resolve(courseDetail)
	//			reject(errCode)
	getCourseDetail: function getCourseDetail (jsessionid, sid, courseId) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		var query = querystring.stringify({
			sid: sid,
			id: courseId
		});
		var options = {
		    host: 'uems.sysu.edu.cn',
		    path: '/elect/s/courseDet?' + query,
		    method: 'GET',
		    headers: {
		      	Cookie: 'JSESSIONID=' + jsessionid,
		      	Connection: 'keep-alive'
		    }
	  	};
		return new Promise(function (resolve, reject) {
			var req = http.request(options, function (res) {
				res.setEncoding('utf8');
				if (res.statusCode == 500) {
					reject(statusCode['sid fails']);
				} else {
					var body = [];
					res.on('data', function (chunk) {
						body.push(chunk);
					}).on('end', function () {
						var html = body.join();
						var courseDetail = {};
						var regex = /<td class='lab'>([^>]+)：<\/td>\n\t+<td class='val'[^>]*>[\n\t]*([^>\t\n]*)[\n\t]*<\/td>/g;
						for (var match = regex.exec(html); match; match = regex.exec(html)) {
							courseDetail[match[1]] = match[2];
						}
						resolve(courseDetail);
					});
				}
			});
			req.on('error', function (err) {
				debug(err);
				reject(statusCode['http error']);
			});
			req.end();
		});
	},
	// 参数：
	// 		jsessionid 教务系http统登陆的sessionid
	// 		url 课程类型的url
	//		courseId 课程id
	//		isElect true代表选课，false代表退课
	// 作用：
	//		选择课程或退选课程
	// 返回：
	// 		Promise:
	//			resolve()
	//			reject(errCode)
	electCourse: function electCourse (jsessionid, sid, courseId, isElect) {
        debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
		var postData = querystring.stringify({
			jxbh: courseId,
			sid: sid
		});
		var options = {
		    host: 'uems.sysu.edu.cn',
		    path: '/elect/s/' + (isElect ? 'elect' : 'unelect'),
		    method: 'POST',
		    headers: {
		      	Cookie: 'JSESSIONID=' + jsessionid,
		      	Connection: 'keep-alive'
		    }
	  	};
	  	return new Promise(function (resolve, reject) {
			var req = http.request(options, function (res) {
				res.setEncoding('utf8');
				if (res.statusCode == 500) {
					reject(statusCode['sid fails']);
				} else {
					var body = [];
					res.on('data', function (chunk) {
						body.push(chunk);
					}).on('end', function () {
						var html = body.join();
						var regex = /&#034;err&#034;:\{&#034;code&#034;:(\d+)/;
						var errCode = parseInt(regex.exec(html)[0]);
						if (errCode == 0) {
							resolve();
						} else {
							reject(errCode);
						}
					});
				}
			});
			req.on('error', function (err) {
				debug(err);
				reject(statusCode['http error']);
			});
			req.write(postData);
			req.end();
		});
	}
};

module.exports = courseController;