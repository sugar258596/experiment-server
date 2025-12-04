'use strict';

/**
 * 问题反馈路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取反馈列表 (需要登录)
  router.get('/api/feedbacks', jwtAuth, controller.feedback.index);

  // 获取反馈详情 (需要登录)
  router.get('/api/feedbacks/:id', jwtAuth, controller.feedback.show);

  // 创建反馈 (需要登录)
  router.post('/api/feedbacks', jwtAuth, controller.feedback.create);

  // 回复反馈 (教师及以上)
  router.post('/api/feedbacks/:id/reply', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.feedback.reply);

  // 更新反馈状态 (教师及以上)
  router.patch('/api/feedbacks/:id/status', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.feedback.updateStatus);

  // 关闭反馈 (教师及以上)
  router.patch('/api/feedbacks/:id/close', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.feedback.close);

  // 删除反馈 (管理员)
  router.delete('/api/feedbacks/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.feedback.destroy);
};
