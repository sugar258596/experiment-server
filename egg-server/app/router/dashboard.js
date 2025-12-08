'use strict';

module.exports = app => {
  const { router, controller } = app;
  const jwtAuth = app.middleware.jwtAuth();

  // Dashboard 统计接口
  router.get('/api/dashboard/panel', jwtAuth, controller.dashboard.getPanelData);
  router.get('/api/dashboard/user-access-source', jwtAuth, controller.dashboard.getUserAccessSource);
  router.get('/api/dashboard/weekly-activity', jwtAuth, controller.dashboard.getWeeklyActivity);
  router.get('/api/dashboard/monthly-sales', jwtAuth, controller.dashboard.getMonthlySales);
};
