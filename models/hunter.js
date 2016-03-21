var debug = require('debug')('course-elector-server:hunter');
var hunterStatus = require('../variables').hunterStatus;

function Hunter (owner, hunt, quit) {
    this.hunterStatus = hunterStatus['login'];
    this.courseToHunt = new CourseToHunt(hunt);
    this.courseToQuit = quit ? new CourseToHunt(quit) : undefined;
    this.createDate = new Date();
    this.tryTimes = 0;
    this.owner = owner;
    this._id = undefined;
}

function CourseToHunt (id) {
    this.statusCode = null;
    this.id = id;
}

module.exports = {
    Hunter: Hunter,
    CourseToHunt: CourseToHunt
};