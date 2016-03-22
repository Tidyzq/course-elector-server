var debug = require('debug')('course-elector-server:hunterController');
var ObjectID = require('mongodb').ObjectID;
var statusCode = require('../variables').statusCode;
var hunterStatus = require('../variables').hunterStatus;
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
        //			reject(errCode)
        addHunter: function addHunter(hunter) {
            debug(/function (\w*)/.exec(arguments.callee.toString())[1]);
            return new Promise(function (resolve, reject) {
                if (Hunter.prototype.isPrototypeOf(hunter)) {
                    hunterCollection.insert(hunter).then(function (resultArr) {
                        var hunterId = resultArr.insertedIds[1];
                        resolve(hunterId);
                    }, function (error) {
                        debug(error);
                        reject(statusCode['db error']);
                    });
                } else {
                    reject(statusCode['invalid arguments']);
                }
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
                    reject(statusCode['db error']);
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
                        reject(statusCode['db error']);
                    });
                } else {
                    reject(statusCode['invalid arguments'])
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
                        reject(statusCode['db error']);
                    });
                } else {
                    reject(statusCode['invalid arguments']);
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
                    hunterCollection.find({'owner': userId}).toArray().then(function (foundHunters) {
                        resolve(foundHunters);
                    }, function (error) {
                        debug(error);
                        reject(statusCode['db error']);
                    });
                } else {
                    reject(statusCode['invalid arguments']);
                }
            });
        }
    }
};