var express = require('express');
var debug = require('debug')('course-elector-server:courseElector');
var statusCode = require('../variables').statusCode;
var hunterStatus = require('../variables').hunterStatus;
var childProcess = require('child_process');

module.exports = function (db) {

    var userController = require('../controllers/userController')(db);
    var courseController = require('../controllers/courseController');
    var tokenController = require('../controllers/tokenController');
    var hunterController = require('../controllers/hunterController')(db);
    var router = express.Router();
    var hunterProcess = childProcess.fork('./background/hunterProcess');

    function Response(status, data) {
        this.status = status;
        this.data = data;
    }

    router.all('*', function (req, res, next) {
        debug(req.path);
        next();
    });

    router.post('/login', function(req, res, next) {
        var username = req.body.username, password = req.body.password;
        userController.login(username, password).then(function (userId) {
            return tokenController.getToken(userId);
        }).then(function (token) {
            res.json(new Response(statusCode.success, {token: token}))
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.get('/course-list', function(req, res, next) {
        var token = req.get('token');
        tokenController.verify(token).then(function (userId) {
            return userController.getLoginInfo(userId).then(function (info) {
                return courseController.getCourseList(info.jsessionid, info.sid);
            });
        }).then(function (courseList) {
            res.json(new Response(statusCode.success, {"course-group": courseList}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.get('/course-detail', function(req, res, next) {
        var token = req.get('token'), courseId = req.query.id;
        tokenController.verify(token).then(function (userId) {
            return userController.getLoginInfo(userId).then(function (jsessionid, sid) {
                return courseController.getCourseDetail(jsessionid, sid, courseId);
            });
        }).then(function (courseDetail) {
            res.json(new Response(statusCode.success, {detail: courseDetail}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.post('/elect', function(req, res, next) {
        var token = req.get('token'), courseId = req.query.id;
        tokenController.verify(token).then(function (userId) {
            return userController.getLoginInfo(userId).then(function (jsessionid, sid) {
                return courseController.electCourse(jsessionid, sid, courseId, true);
            });
        }).then(function () {
            res.json(new Response(statusCode.success, {}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.post('/unelect', function(req, res, next) {
        var token = req.get('token'), courseId = req.query.id;
        tokenController.verify(token).then(function (userId) {
            return userController.getLoginInfo(userId).then(function (jsessionid, sid) {
                return courseController.electCourse(jsessionid, sid, courseId, false);
            });
        }).then(function () {
            res.json(new Response(statusCode.success, {}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.post('/new-hunter', function(req, res, next) {
        var token = req.get('token'), courseToHunt = req.body.courseToHunt, courseToQuit = req.body.courseToQuit;
        tokenController.verify(token).then(function (userId) {
            return hunterController.addHunter(courseToHunt, courseToQuit, userId);
        }).then(function (hunterId) {
            hunterProcess.send({create: hunterId});
            res.json(new Response(statusCode.success, {}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.get('/hunters', function(req, res, next) {
        var token = req.get('token');
        tokenController.verify(token).then(function (userId) {
            return hunterController.getHunterByOwner(userId);
        }).then(function (hunters) {
            res.json(new Response(statusCode.success, {hunters: hunters}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.post('/kill-hunter', function(req, res, next) {
        var token = req.get('token'), hunterId = req.body.id;
        tokenController.verify(token).then(function (userId) {
            return hunterController.isOwnedBy(hunterId, userId);
        }).then(function () {
            hunterProcess.send({kill: hunterId});
            res.json(new Response(statusCode.success, {}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });

    router.delete('/remove-hunter', function(req, res, next) {
        var token = req.get('token'), hunterId = req.body.id;
        tokenController.verify(token).then(function (userId) {
            return hunterController.isOwnedBy(hunterId, userId).then(function (hunter) {
                return hunter.hunterStatus == hunterStatus.dead ? hunterController.deleteHunter(hunterId) : Promise.reject(statusCode.hunter_is_alive);
            });
        }).then(function () {
            res.json(new Response(statusCode.success, {}));
        }).catch(function (error) {
            if (Number.isInteger(error)) {
                res.json(new Response(error, {}));
            } else {
                debug(error);
                res.end();
            }
        });
    });
    return router;
}
