'use strict';

/**
 * 预约管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取预约列表 (公开)
  router.get('/api/appointments', controller.appointment.index);

  // 获取我的预约 (需要登录)
  router.get('/api/appointments/my', jwtAuth, controller.appointment.findMyAppointments);

  // 获取待审核预约 (教师及以上)
  router.get('/api/appointments/pending', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.appointment.getPendingAppointments);

  // 获取预约详情 (公开)
  router.get('/api/appointments/:id', controller.appointment.show);

  // 创建预约 (需要登录)
  router.post('/api/appointments', jwtAuth, controller.appointment.create);

  // 更新预约 (需要登录)
  router.put('/api/appointments/:id', jwtAuth, controller.appointment.update);

  // 取消预约 (DELETE方法，需要登录)
  router.delete('/api/appointments/:id', jwtAuth, controller.appointment.destroy);

  // 取消预约 (PATCH方法，需要登录)
  router.patch('/api/appointments/cancel/:id', jwtAuth, controller.appointment.cancel);

  // 审核预约 (教师及以上)
  router.put('/api/appointments/review/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.appointment.review);
};
