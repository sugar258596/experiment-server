'use strict';

/**
 * 仪器申请路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取我的申请列表 (需要登录)
  router.get('/api/instrument-applications/my', jwtAuth, controller.instrumentApplication.my);

  // 获取申请列表 (教师及以上)
  router.get('/api/instrument-applications', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrumentApplication.index);

  // 申请使用仪器 (需要登录)
  router.post('/api/instrument-applications/apply/:id', jwtAuth, controller.instrumentApplication.apply);

  // 取消申请 (需要登录)
  router.delete('/api/instrument-applications/:id', jwtAuth, controller.instrumentApplication.cancel);

  // 审核申请 (教师及以上)
  router.post('/api/instrument-applications/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrumentApplication.review);
};
