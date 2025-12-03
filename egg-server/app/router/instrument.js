'use strict';

/**
 * 仪器管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取仪器列表 (公开)
  router.get('/api/instruments', controller.instrument.index);

  // 获取仪器下拉选择列表 (公开)
  router.get('/api/instruments/options', controller.instrument.getInstrumentSelect);

  // 获取仪器详情 (公开)
  router.get('/api/instruments/:id', controller.instrument.show);

  // 创建仪器 (教师及以上)
  router.post('/api/instruments', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrument.create);

  // 更新仪器信息 (教师及以上)
  router.post('/api/instruments/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrument.update);

  // 删除仪器 (管理员)
  router.delete('/api/instruments/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.instrument.destroy);
};
