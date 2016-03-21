var express = require('express');
var debug = require('debug')('course-elector-server:courseElector');
var router = express.Router();
var statusCode = require('../controllers/variables').statusCode;

module.exports = function (db) {

	var userController = require('../controllers/userController')(db);
	var courseController = require('../controllers/courseController');
	var tokenController = require('../controllers/tokenController');

	function response(status, data) {
		this.status = status;
		this.data = data;
	}

	router.post('/login', function(req, res, next) {
		debug(req.path);
		var username = req.body.username, password = req.body.password;
		userController.login(username, password).then(function (userId) {
			tokenController.getToken(userId).then(function (token) {
				res.json(new response(0, {token: token}));
			});
		}, function (errorCode) {
			res.json(new response(errorCode, {}));
		}).catch(function (error) {
			debug(error);
			res.end();
		});
	});

	router.get('/course-list', function(req, res, next) {
		debug(req.path);
		var token = req.headers.token;
		tokenController.verify(token).then(function (userId) {
			userController.getLoginInfo(userId).then(function (info) {
				courseController.getCourseList(info.jsessionid, info.sid).then(function (courseList) {
					res.json(new response(0, {"course-group": courseList}));
				});
			});
		}, function (errorCode) {
			res.json(new response(errorCode, {}));
		}).catch(function (error) {
			debug(error);
			res.end();
		});
	});

	router.get('/course-detail', function(req, res, next) {
		debug(req.path);
		var token = req.query.token, courseId = req.query['course-id'];
		tokenController.verify(token).then(function (userId) {
			userController.getLoginInfo(userId).then(function (jsessionid, sid) {
				courseController.getCourseDetail(jsessionid, sid, courseId).then(function (courseDetail) {
					res.json(new response(0, courseDetail));
				});
			});
		}, function () {
			res.json(new response(2, {}));
		}).catch(function (error) {
			debug(error);
			res.end();
		});
	});

	router.post('/elect', function(req, res, next) {
		debug(req.path);
		var token = req.body.token, courseId = req.query['course-id'];
		tokenController.verify(token).then(function (userId) {
			userController.getLoginInfo(userId).then(function (jsessionid, sid) {
				courseController.electCourse(jsessionid, sid, courseId).then(function () {
					res.json(new response(0, {}));
				}, function (errorCode) {
					res.json(new response(errorCode, {}));
				});
			});
		}, function () {
			res.json(new response(26, {}));
		}).catch(function (error) {
			debug(error);
			res.end();
		});
	});

	router.post('/unelect', function(req, res, next) {
		debug(req.path);
		var token = req.body.token, courseId = req.query['course-id'];
		tokenController.verify(token).then(function (userId) {
			userController.getLoginInfo(userId).then(function (jsessionid, sid) {
				courseController.unelectCourse(jsessionid, sid, courseId).then(function () {
					res.json(new response(0, {}));
				}, function (errorCode) {
					res.json(new response(errorCode, {}));
				});
			});
		}, function () {
			res.json(new response(26, {}));
		}).catch(function (error) {
			debug(error);
			res.end();
		});
	});

	// router.post('/new-hunter', function(req, res, next) {

	// });

	// router.post('/hunters', function(req, res, next) {

	// });

	// router.post('/kill-hunter', function(req, res, next) {

	// });

	// router.delete('/remove-hunter', function(req, res, next) {

	// });
	return router;
}
