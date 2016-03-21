var statusCode = {
	"success": 																	0,
	"非法操作! 数据库没有对应的教学班号。": 											1,
	"当前不在此课程类别的选课时间范围内！": 											2,
	"您不在该教学班的修读对象范围内，不允许选此教学班！": 								3,
	"您所在的学生群体，在此阶段不允许对该课程类别的课进行选课、退课！": 					4,
	"系统中没有您这个学期的报到记录，不允许选课。请联系您所在院系的教务员申请补注册。": 	5,
	"您这个学期未完成评教任务，不允许选课。": 										6,
	"您不满足该教学班选课的性别要求，不能选此门课程！": 								7,								
	"不允许跨校区选课！": 															8,
	"此课程已选，不能重复选择！": 													9,
	"您所选课程 的成绩为“已通过”，因此不允许再选该课，请重新选择！": 					10,
	"此类型课程已选学分总数超标": 													11,
	"此类型课程已选门数超标": 														12,
	"毕业班学生，公选学分已满，最后一个学期不允许选择公选课！": 						13,
	"您不是博雅班学生，不能选此门课程！": 											14,
	"您最多能选2门博雅班课程！": 													15,
	"您不是基础实验班学生，不能选此门课程！": 										16,
	"所选课程与已选课程上课时间冲突,请重新选择!": 									17,
	"已经超出限选人数，请选择别的课程！": 											18,
	"该教学班不参加选课，你不能选此教学班！": 										19,
	"选课等待超时": 																20,
	"您这个学期未完成缴费，不允许选课。请联系财务处帮助台（84036866 再按 3）": 			21,
	"您未满足选择该课程的先修课程条件!": 											22,
	"不在此课程类型的选课时间范围内": 												23,
	"您的核心通识课学分已满足培养方案的学分要求，无法再选择核心通识课": 					24,
	"您不是卓越班学生，不能选此门课程！": 											25,
	"invalid token": 															26,
	"token expired": 															27,
	"invalid password": 														28,
	"wrong checkcode": 															29,
	"cookie fails": 															30,
	"sid fails": 																31,
	"http error": 																32,
    "invalid arguments":                                                        33,
    "db error":                                                                 34
}

var hunterStatus = {
    "dead": 0,
    "hunting": 1,
    "login": 2,
    "quit": 3
}

var signature = "this-is-signature233";

var db_path = "mongodb://server:aw8GC6S7@localhost:27017/course-elector";

module.exports = {
	statusCode: statusCode,
	signature: signature,
	db_path: db_path,
    hunterStatus: hunterStatus
};