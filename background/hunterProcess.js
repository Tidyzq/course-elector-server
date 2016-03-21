var debug = require('debug')('course-elector-server:hunterProcess');
var db_path = require('../variables').db_path;
var statusCode = require('../variables').statusCode;
var hunterStatus = require('../variables').hunterStatus;
var mongoClient = require('mongodb').MongoClient;
var childProcess = require('child_process');

mongoClient.connect(db_path).then(function (db) {
	debug("Connect to mongodb " + db_path + " succeed");
	var userController = require('../controllers/userController')(db);
	var courseController = require('../controllers/courseController');
	var hunterController = require('../controllers/hunterController')(db);

	var hunterStack = {};
	var userInfo = {}; // 缓存用户信息(jsessionid, sid)

	var timer = setInterval(function () {
		for (var hunterId in hunterStack) {
			var hunter = hunterStack[hunterId];
            switch (hunter.hunterStatus) {
                case hunterStatus['dead']:
                    // TODO
                    // use hunterController to update
                    delete hunterStack[hunterId];
                    break;
                case hunterStatus['hunting']:
                    if (userInfo[hunter.owner]) {
                        courseController.electCourse(userInfo[hunter.owner].jsessionid, userInfo[hunter.owner].sid, true).then(function () {
                            hunterStack[hunterId].courseToHunt.statusCode = statusCode['success'];
                            hunterStack[hunterId].hunterStatus = hunterStatus['dead'];
                        }, function (errCode) {
                            hunterStack[hunterId].courseToHunt.statusCode = errCode;
                            switch (errCode) {
                                case statusCode["此类型课程已选学分总数超标"]:
                                case statusCode["此类型课程已选门数超标"]:
                                case statusCode["所选课程与已选课程上课时间冲突,请重新选择!"]:
                                    hunterStack[hunterId].hunterStatus = hunterStatus['quit'];
                                    break;
                                case statusCode["当前不在此课程类别的选课时间范围内！"]:
                                case statusCode["系统中没有您这个学期的报到记录，不允许选课。请联系您所在院系的教务员申请补注册。"]:
                                case statusCode["您这个学期未完成评教任务，不允许选课。"]:
                                case statusCode["已经超出限选人数，请选择别的课程！"]:
                                case statusCode["选课等待超时"]:
                                case statusCode["您这个学期未完成缴费，不允许选课。请联系财务处帮助台（84036866 再按 3）"]:
                                case statusCode["不在此课程类型的选课时间范围内"]:
                                    hunterStack[hunterId].tryTimes++;
                                    break;
                                case statusCode["cookie fails"]:
                                case statusCode["sid fails"]:
                                    delete userInfo[hunter.owner];
                                    hunterStack[hunterId].hunterStatus = hunterStatus['login'];
                                    break;
                                default:
                                    hunterStack[hunterId].hunterStatus = hunterStatus['dead'];
                                    break;
                            }
                        });
                    } else {
                        hunterStack[hunterId].hunterStatus = hunterStatus['login'];
                    }
                    break;
                case hunterStatus['quit']:
                    // TODO
                    break;
                case hunterStatus['login']:
                    if (!userInfo[hunter.owner]) {
                        userInfo[hunter.owner] = 'getting...';
                        userController.getLoginInfo(hunter.owner).then(function (jsessionId, sid) {
                            userInfo[hunter.owner] = {
                                jsessionid: jsessionId,
                                sid: sid
                            };
                        }, function (errCode) {
                            hunterStack[hunterId].hunterStatus = hunterStatus['dead'];
                        });
                    } else if (userInfo[hunter.owner] != 'getting...') {
                        hunterStack[hunterId].hunterStatus = hunterStatus['hunting'];
                    }
                    break;
            }
			//if (userInfo[hunter.owner]) { // 已获得用户信息
			//	var jsessionid = userInfo[hunter.owner].jsessionid, sid = userInfo[hunter.owner].sid;
			//	courseController.electCourse(jsessionid, sid, hunter.courseToHunt.id, true).then(function () {
			//		hunter.courseToHunt.statusCode = statusCode['success'];
			//		if (hunter.courseToQuit) {
			//			courseController.electCourse(jsessionid, sid, hunter.courseToQuit.id, false).then(function () {
			//				hunter.courseToQuit.state = statusCode['success'];
			//			}, function (errCode) {
			//				hunter.courseToQuit.state = errCode;
			//			}).then(function () {
			//				hunterController.killHunter(hunterId);
			//			});
			//		}
			//	}, function (errCode) {
             //       switch (errCode) {
             //           case statusCode['sid fails']:
             //               delete userInfo[hunter.owner];
             //               break;
             //           case statusCode['']
             //       }
			//	});
			//} else { // 未获得用户信息
			//	userController.getLoginInfo(hunter.owner).then(function (jsessionid, sid) {
			//		userInfo[hunter.owner] = {
			//			jsessionid: jsessionid,
			//			sid: sid
			//		};
			//	}, function (errCode) {
			//		debug('Error on getting user info, errCode:' + errCode);
			//		hunterController.killHunter(hunterId);
			//		delete hunterStack[hunterId];
			//	});
			//}
		}
	}, 100);

	process.on('message', function (message) {
		// create: hunterId
		// kill: hunterId
		if (message.create) {
			var hunterId = message.create;
			hunterController.getHunter(hunterId).then(function (hunter) {
				hunterStack[hunterId] = hunter;
			}, function () {
				debug('Hunter: ' + hunterId + ' not found');
			});
		}
		if (message.kill) {
			var hunterId = message.kill;
			if (hunterStack[hunterId]) hunterStack[hunterId].hunterStatus = hunterStatus['dead'];
		}
	});

	process.on('exit', function (code) {
		db.close();
		clearInterval(timer);
		debug("Connection closed");
	});

}).catch(function (error) {
	debug("Connect to mongodb " + db_path + " failed with error: ", error);
});