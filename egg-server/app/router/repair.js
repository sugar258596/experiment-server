'use strict';

/**
 * 维修管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取维修记录 (管理员)
  router.get('/api/repairs', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.repair.index);

  // 获取我的维修记录 (需要登录)
  router.get('/api/repairs/my', jwtAuth, controller.repair.getMyRepairs);

  // 报告仪器故障 (需要登录)
  router.post('/api/repairs/instruments/:instrumentId', jwtAuth, controller.repair.report);

  // 更新维修状态 (管理员)
  router.post('/api/repairs/update/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.repair.updateRepairStatus);

  // 取消报修 (需要登录)
  router.delete('/api/repairs/:id', jwtAuth, controller.repair.cancel);
};
