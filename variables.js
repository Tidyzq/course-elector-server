var statusCode = {
	'success': 									0,
	'wrong_course_id': 							1, // 非法操作! 数据库没有对应的教学班号。
	'wrong_time_to_elect_this_category': 		2, // 当前不在此课程类别的选课时间范围内！
	'not_in_the_target_class': 					3, // 您不在该教学班的修读对象范围内，不允许选此教学班！
	'wrong_time_to_operate': 					4, // 您所在的学生群体，在此阶段不允许对该课程类别的课进行选课、退课！
	'no_registration_record': 					5, // 系统中没有您这个学期的报到记录，不允许选课。请联系您所在院系的教务员申请补注册。
	'no_evaluation_record': 					6, // 您这个学期未完成评教任务，不允许选课。
	'wrong_sex': 								7, // 您不满足该教学班选课的性别要求，不能选此门课程！
	'wrong_campus': 							8, // 不允许跨校区选课！
	'already_elected': 							9, // 此课程已选，不能重复选择！
	'already_passed': 							10, // 您所选课程 的成绩为“已通过”，因此不允许再选该课，请重新选择！
	'score_overflow': 							11, // 此类型课程已选学分总数超标
	'quantity_of_elected_course_overflow': 		12, // 此类型课程已选门数超标
	'score_of_optional_course_overflow': 		13, // 毕业班学生，公选学分已满，最后一个学期不允许选择公选课！
	'not_liberal_arts_student': 				14, // 您不是博雅班学生，不能选此门课程！
	'quantity_of_liberal_arts_course_overflow': 15, // 您最多能选2门博雅班课程！
	'not_experimental_student': 				16, // 您不是基础实验班学生，不能选此门课程！
	'course_conflict': 							17, // 所选课程与已选课程上课时间冲突,请重新选择!
	'no_empty_seat': 							18, // 已经超出限选人数，请选择别的课程！
	'inselectable_course': 						19, // 该教学班不参加选课，你不能选此教学班！
	'operation_time_out': 						20, // 选课等待超时
	'no_payment_record': 						21, // 您这个学期未完成缴费，不允许选课。请联系财务处帮助台（84036866 再按 3）
	'unfulfill_required_courses': 				22, // 您未满足选择该课程的先修课程条件!
	'wrong_time_to_elect_this_type': 			23, // 不在此课程类型的选课时间范围内
	'score_of_core_course_overflow': 			24, // 您的核心通识课学分已满足培养方案的学分要求，无法再选择核心通识课
	'not_advanced_student': 					25, // 您不是卓越班学生，不能选此门课程！
	'invalid_token': 							26,
	'token_expired': 							27,
	'invalid_password': 						28,
	'wrong_checkcode': 							29,
	'cookie_fails': 							30,
	'sid_fails': 								31,
	'http_error': 								32,
    'invalid_arguments':                        33,
    'db_error':                                 34
};

var hunterStatus = {
    'dead': 	0,
    'hunt': 	1,
    'login': 	2,
    'quit': 	3,
    'lock': 	4
};

var signature = 'this-is-signature233';

var db_path = 'mongodb://server:aw8GC6S7@localhost:27017/course-elector';

module.exports = {
	statusCode: statusCode,
	signature: signature,
	db_path: db_path,
    hunterStatus: hunterStatus
};