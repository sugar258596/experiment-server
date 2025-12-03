'use strict';

/**
 * 实验室管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取实验室列表 (公开，但支持可选认证以获取收藏状态)
  router.get('/api/labs', jwtAuth, controller.lab.index);

  // 获取热门实验室 (公开，但支持可选认证以获取收藏状态)
  router.get('/api/labs/popular', jwtAuth, controller.lab.getPopularLabs);

  // 获取实验室下拉列表 (公开)
  router.get('/api/labs/options', controller.lab.getOptions);

  // 获取我创建的实验室 (教师及以上)
  router.get('/api/labs/my', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.lab.getMyLabs);

  // 获取实验室详情 (公开，但支持可选认证以获取收藏状态)
  router.get('/api/labs/:id', jwtAuth, controller.lab.show);

  // 创建实验室 (教师及以上)
  router.post('/api/labs', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.lab.create);

  // 更新实验室信息 (教师及以上)
  router.post('/api/labs/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.lab.update);

  // 删除实验室 (管理员)
  router.delete('/api/labs/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.lab.destroy);
};
