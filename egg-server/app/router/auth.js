'use strict';

/**
 * 认证路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const jwtAuth = app.middleware.jwtAuth();

  // 注册
  router.post('/api/auth/register', controller.auth.register);
  // 登录
  router.post('/api/auth/login', controller.auth.login);
  // 登出
  router.post('/api/auth/logout', jwtAuth, controller.auth.logout);
};
