'use strict';

/**
 * 评价管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取评价列表 (公开)
  router.get('/api/evaluations', controller.evaluation.index);

  // === 实验室评论 ===
  // 创建实验室评论（需要登录，需要预约审核通过）
  router.post('/api/evaluations/lab', jwtAuth, controller.evaluation.createLabEvaluation);

  // 获取实验室评论列表 (公开)
  router.get('/api/evaluations/lab/:labId', controller.evaluation.findByLab);

  // 获取实验室评价统计 (公开)
  router.get('/api/evaluations/lab/:labId/statistics', controller.evaluation.getLabStatistics);

  // 根据预约ID获取评论 (需要登录)
  router.get('/api/evaluations/appointment/:appointmentId', jwtAuth, controller.evaluation.findByAppointment);

  // === 仪器评价 ===
  // 创建仪器评价（需要登录，需要申请审核通过）
  router.post('/api/evaluations/instrument', jwtAuth, controller.evaluation.createInstrumentEvaluation);

  // 获取仪器评价列表 (公开)
  router.get('/api/evaluations/instrument/:instrumentId', controller.evaluation.findByInstrument);

  // 获取仪器评价统计 (公开)
  router.get('/api/evaluations/instrument/:instrumentId/statistics', controller.evaluation.getInstrumentStatistics);

  // 根据仪器申请ID获取评价 (需要登录)
  router.get('/api/evaluations/instrument-application/:applicationId', jwtAuth, controller.evaluation.findByInstrumentApplication);

  // === 通用 ===
  // 删除评价（需要登录，只能删除自己的）
  router.delete('/api/evaluations/:id', jwtAuth, controller.evaluation.destroy);
};
