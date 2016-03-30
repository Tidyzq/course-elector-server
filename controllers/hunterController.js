var debug = require('debug')('course-elector-server:hunterController');
var ObjectID = require('mongodb').ObjectID;
var statusCode = require('../variables').statusCode;
var Hunter = require('../models/hunter.js').Hunter;

module.exports = function(db) {
    var hunterCollection = db.collection('hunters');

    return {
        // 参数：
        // 		hunter 添加到数据库的hunter信息
        // 作用：
        //		在数据库中添加hunter
        // 返回：
        // 		Promise:
        //			resolve(hunterId)
        //			reject(statusCode)
        addHunter: function addHunter(courseToHunt, courseToQuit, owner) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                var uid = ObjectID(owner);
                var hunter = new Hunter(uid, courseToHunt, courseToQuit);
                hunterCollection.insert(hunter).then(function (resultArr) {
                    var hunterId = resultArr.insertedIds[1];
                    resolve(hunterId);
                }, function (error) {
                    debug(error);
                    reject(statusCode.db_error);
                });
            });
        },

        // 参数：
        // 		hunterId hunter在数据库中的_id
        // 作用：
        //		在数据库中删除对应hunterId的hunter
        // 返回：
        // 		Promise:
        //			resolve()
        //			reject(errCode)
        deleteHunter: function deleteHunter(hunterId) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                var id = ObjectID(hunterId);
                hunterCollection.deleteOne({'_id': id}).then(function () {
                    resolve();
                }, function (error) {
                    debug(error);
                    reject(statusCode.db_error);
                });
            });
        },

        // 参数：
        // 		hunterId hunter在数据库中的_id
        // 作用：
        //		在数据库中修改对应hunterId的hunter
        // 返回：
        // 		Promise:
        //			resolve()
        //			reject(errCode)
        updateHunter: function updateHunter(hunter) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                if (Hunter.prototype.isPrototypeOf(hunter) && hunter._id) {
                    var id = ObjectID(hunter._id);
                    hunterCollection.updateOne({'_id': id}, hunter).then(function () {
                        resolve();
                    }, function (error) {
                        debug(error);
                        reject(statusCode.db_error);
                    });
                } else {
                    reject(statusCode.invalid_arguments)
                }
            });
        },

        // 参数：
        // 		hunterId hunter在数据库中的_id
        // 作用：
        //		在数据库中查找对应hunterId的hunter
        // 返回：
        // 		Promise:
        //			resolve(foundHunter)
        //			reject(errCode)
        getHunterById: function getHunterById(hunterId) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                if (hunterId) {
                    var id = ObjectID(hunterId);
                    hunterCollection.findOne({'_id': id}).then(function (foundHunter) {
                        resolve(foundHunter);
                    }, function (error) {
                        debug(error);
                        reject(statusCode.db_error);
                    });
                } else {
                    reject(statusCode.invalid_arguments);
                }
            });
        },

        // 参数：
        // 		userId 用户的id
        // 作用：
        //		在数据库中查找被该用户拥有的hunter
        // 返回：
        // 		Promise:
        //			resolve(foundHunters)
        //			reject(errCode)
        getHunterByOwner: function getHuntersByOwner(userId) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                if (userId) {
                    var uid = ObjectID(userId);
                    hunterCollection.find({'owner': uid}).toArray().then(function (foundHunters) {
                        resolve(foundHunters);
                    }, function (error) {
                        debug(error);
                        reject(statusCode.db_error);
                    });
                } else {
                    reject(statusCode.invalid_arguments);
                }
            });
        },

        // 参数：
        // 		hunterId hunter在数据库中的_id
        // 		userId 用户的id
        // 作用：
        //		判断该hunter是否属于该用户
        // 返回：
        // 		Promise:
        //			resolve(foundHunter)
        //			reject(errCode)
        isOwnedBy: function isOwnedBy(hunterId, userId) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                if (userId && hunterId) {
                    var uid = ObjectID(userId), hid = ObjectID(hunterId);
                    hunterCollection.findOne({'_id': hid}).then(function (foundHunter) {
                        if (foundHunter.owner == uid) {
                            resolve(foundHunter);
                        } else {
                            reject(statusCode.not_owned);
                        }
                    }, function (error) {
                        debug(error);
                        reject(statusCode.db_error);
                    });
                } else {
                    reject(statusCode.invalid_arguments);
                }
            });
        }
    }
};