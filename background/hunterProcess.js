var debug = require('debug')('course-elector-server:hunterProcess');
var db_path = require('../variables').db_path;
var statusCode = require('../variables').statusCode;
var hunterStatus = require('../variables').hunterStatus;
var mongoClient = require('mongodb').MongoClient;
var deasync = require('deasync');

mongoClient.connect(db_path).then(function (db) {
	debug("Connect to mongodb " + db_path + " succeed");
	var userController = require('../controllers/userController')(db);
	var courseController = require('../controllers/courseController');
	var hunterController = require('../controllers/hunterController')(db);

	var hunterStack = {};
	var userInfo = {}; // 缓存用户信息(jsessionid, sid)

	var clocker_timer = setInterval(function () { // 每0.1秒一个周期
		for (var hunterId in hunterStack) {
            if (hunterStack.hasOwnProperty(hunterId)) {
                (function (hunterId) {
                    var hunter = hunterStack[hunterId];
                    var ownerInfo = userInfo[hunter.owner];
                    switch (hunter.hunterStatus) {
                        case hunterStatus.dead: // 当hunter终止时
                            delete hunterStack[hunterId]; // 从堆栈中弹出
                            // 向数据库更新
                            hunterController.updateHunter(hunter).catch(function (errCode) {
                                debug('hunter ' + hunterId + ' update failed with error code:' + errCode);
                            });
                            break;
                        case hunterStatus.hunt: // hunter刷课中
                            if (ownerInfo && ownerInfo != 'getting...') {
                                hunter.hunterStatus = hunterStatus.lock; // 将hunter锁住,直到本次请求完成
                                courseController.electCourse(ownerInfo.jsessionid, ownerInfo.sid, hunter.courseToHunt.id, true).then(function () {
                                    // 刷课成功,将刷课信息保存后结束
                                    hunter.courseToHunt.statusCode = statusCode.success;
                                    hunter.hunterStatus = hunterStatus.dead;
                                }, function (errCode) {
                                    hunter.courseToHunt.statusCode = errCode;
                                    switch (errCode) {
                                        case statusCode.score_overflow:
                                        case statusCode.quantity_of_elected_course_overflow:
                                        case statusCode.course_conflict:
                                            // 需要先退课才能选课
                                            hunter.hunterStatus = hunterStatus.quit;
                                            break;
                                        case statusCode.wrong_time_to_elect_this_category:
                                        case statusCode.no_registration_record:
                                        case statusCode.no_evaluation_record:
                                        case statusCode.no_empty_seat:
                                        case statusCode.operation_time_out:
                                        case statusCode.no_payment_record:
                                        case statusCode.wrong_time_to_elect_this_type:
                                            // 本次刷课失败,等待下一刷课周期
                                            hunter.hunterStatus = hunterStatus.hunt;
                                            hunter.tryTimes++;
                                            break;
                                        case statusCode.cookie_fails:
                                        case statusCode.sid_fails:
                                            // 用户信息出错,等待重新获取用户信息
                                            delete userInfo[hunter.owner];
                                            hunter.hunterStatus = hunterStatus.login;
                                            break;
                                        default:
                                            // 刷课遇到错误,直接结束
                                            debug('hunter ' + hunterId + ' hunt failed with error code: ' + errCode);
                                            hunter.hunterStatus = hunterStatus.dead;
                                            break;
                                    }
                                });
                            } else { // 如果没有在缓存中找到用户信息,则获取用户信息
                                hunter.hunterStatus = hunterStatus.login;
                            }
                            break;
                        case hunterStatus.quit: // 当需要退课
                            if (!hunter.courseToQuit && hunter.courseToQuit.statusCode == null) { // 存在可退课程并且课程尚未退选
                                hunter.hunterStatus = hunterStatus.lock;
                                courseController.electCourse(ownerInfo.jsessionid, ownerInfo.sid, hunter.courseToQuit.id, false).then(function () {
                                    // 退课成功,保存信息并返回刷课
                                    hunter.courseToQuit.statusCode = statusCode.success;
                                    hunter.hunterStatus = hunterStatus.hunt;
                                }, function (errCode) {
                                    // 退课失败,直接终止
                                    debug('hunter ' + hunterId + ' quit course failed with error code: ' + errCode);
                                    hunter.courseToQuit.statusCode = errCode;
                                    hunter.hunterStatus = hunterStatus.dead;
                                });
                            } else { // 如果不存在可退选课程,则终止
                                debug('hunter ' + hunterId + ' can\'t find course to quit');
                                hunter.hunterStatus = hunterStatus.dead;
                            }
                            break;
                        case hunterStatus.login: // 当需要获取用户信息
                            if (!ownerInfo) {
                                ownerInfo = 'getting...'; // 将用户信息设为'getting...'防止重复获取
                                userController.getLoginInfo(hunter.owner).then(function (jsessionId, sid) {
                                    userInfo[hunter.owner] = {
                                        jsessionid: jsessionId,
                                        sid: sid
                                    };
                                }, function (errCode) {
                                    debug('hunter ' + hunterId + ' get login info failed with error code: ' + errCode);
                                    hunter.hunterStatus = hunterStatus.dead;
                                });
                            } else if (ownerInfo != 'getting...') { // 已经获取则进入刷课循环
                                hunter.hunterStatus = hunterStatus.hunt;
                            }
                            break;
                        case hunterStatus.lock: // 当正在等待http返回,不做任何事
                            break;
                    }
                })(hunterId);
            }
		}
	}, 100);

    var update_timer = setInterval(function () { // 每3秒一个周期
        for (var hunterId in hunterStack) {
            if (hunterStack.hasOwnProperty(hunterId)) {
                (function (hunterId) {
                    hunterController.updateHunter(hunterStack[hunterId]).catch(function (errCode) {
                        debug('hunter ' + hunterId + ' update failed with error code:' + errCode);
                    });
                })(hunterId);
            }
        }
    }, 3000);


	process.on('message', function (message) {
		// create: hunterId
		// kill: hunterId
        var hunterId;
		if (message.create) {
			hunterId = message.create;
			hunterController.getHunterById(hunterId).then(function (hunter) {
				hunterStack[hunterId] = hunter;
			}, function () {
				debug('Hunter: ' + hunterId + ' not found');
			});
		}
		if (message.kill) {
            hunterId = message.kill;
			if (hunterStack[hunterId]) hunterStack[hunterId].hunterStatus = hunterStatus['dead'];
		}
	});

    function saveData() {
        var counter = 0, target = hunterStack.length;
        // 保存hunter数据
        for (var hunterId in hunterStack) {
            if (hunterStack.hasOwnProperty(hunterId)) {
                (function (hunterId) {
                    hunterController.updateHunter(hunterStack[hunterId]).then(function () {
                        counter++;
                    }, function (errCode) {
                        debug('save hunter ' + hunterId + ' failed with errCode: ' + errCode);
                    });
                })(hunterId);
            }
        }
        deasync.loopWhile(function () { // 将异步转换为同步
            return counter != target;
        });
    }

    process.on('SIGINT', function () { // 监听 ctrl + c
       process.exit();
    });

	process.on('exit', function (code) {
		clearInterval(clocker_timer);
        clearInterval(update_timer); // 关闭刷课和更新循环
        saveData();
		db.close();
		debug("Connection closed " + code);
	});

}).catch(function (error) {
	debug("Connect to mongodb " + db_path + " failed with error: ", error);
});