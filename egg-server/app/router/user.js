'use strict';

/**
 * 用户管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 检查用户是否存在
  router.post('/api/user/check-existence', controller.user.checkExistence);

  // 获取当前用户信息 (需要登录) - 必须在 /api/user/:id 之前
  router.get('/api/user/info', jwtAuth, controller.user.getProfile);

  // 更新个人信息 (需要登录)
  router.post('/api/user/profile', jwtAuth, controller.user.updateProfile);

  // 修改密码 (需要登录)
  router.post('/api/user/change-password', jwtAuth, controller.user.changePassword);

  // 获取所有用户 (管理员) - 必须在 /api/user/:id 之前
  router.get('/api/user', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.index);

  // 管理员更新用户信息 (管理员)
  router.patch('/api/user/admin/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.updateByAdmin);

  // 获取用户详情 - 动态路由放在最后
  router.get('/api/user/:id', jwtAuth, controller.user.show);

  // 创建用户 (管理员)
  router.post('/api/user', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.create);

  // 更新用户 (管理员)
  router.post('/api/user/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.update);

  // 删除用户 (超级管理员)
  router.delete('/api/user/:id', jwtAuth, roles('SUPER_ADMIN'), controller.user.destroy);
};
