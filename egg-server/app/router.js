'use strict';

/**
 * @typedef {Object} Controllers
 * @property {import('./controller/user')} user
 * @property {import('./controller/auth')} auth
 * @property {import('./controller/lab')} lab
 * @property {import('./controller/appointment')} appointment
 * @property {import('./controller/instrument')} instrument
 * @property {import('./controller/instrument-application')} instrumentApplication
 * @property {import('./controller/repair')} repair
 * @property {import('./controller/news')} news
 * @property {import('./controller/notification')} notification
 * @property {import('./controller/favorite')} favorite
 * @property {import('./controller/evaluation')} evaluation
 * @property {import('./controller/banner')} banner
 */

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router } = app;
  /** @type {Controllers} */
  const controller = app.controller;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // ==================== 认证路由 (公开) ====================
  router.post('/api/auth/register', controller.auth.register);
  router.post('/api/auth/login', controller.auth.login);

  // ==================== 用户管理路由 ====================
  // 检查用户名或邮箱是否存在 (公开)
  router.post('/api/user/check-existence', controller.user.checkExistence);

  // 获取当前用户信息 (需要登录) - 必须在 /api/user/:id 之前
  router.get('/api/user/info', jwtAuth, controller.user.getProfile);

  // 更新个人信息 (需要登录)
  router.post('/api/user/profile', jwtAuth, controller.user.updateProfile);

  // 获取所有用户 (管理员) - 必须在 /api/user/:id 之前
  router.get('/api/user', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.index);

  // 管理员更新用户信息 (管理员)
  router.patch('/api/user/admin/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.updateByAdmin);

  // 获取用户详情 - 动态路由放在最后
  router.get('/api/user/:id', jwtAuth, controller.user.show);

  // 创建用户 (管理员)
  router.post('/api/user', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.create);

  // 更新用户 (管理员)
  router.put('/api/user/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.user.update);

  // 删除用户 (超级管理员)
  router.delete('/api/user/:id', jwtAuth, roles('SUPER_ADMIN'), controller.user.destroy);

  // ==================== 实验室管理路由 ====================
  // 获取实验室列表 (公开)
  router.get('/api/labs', controller.lab.index);

  // 获取热门实验室 (公开)
  router.get('/api/labs/popular', controller.lab.getPopularLabs);

  // 获取实验室下拉列表 (公开)
  router.get('/api/labs/options', controller.lab.getOptions);

  // 获取实验室详情 (公开)
  router.get('/api/labs/:id', controller.lab.show);

  // 创建实验室 (教师及以上)
  router.post('/api/labs', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.lab.create);

  // 更新实验室信息 (教师及以上)
  router.post('/api/labs/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.lab.update);

  // 删除实验室 (管理员)
  router.delete('/api/labs/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.lab.destroy);

  // ==================== 预约管理路由 ====================
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

  // ==================== 仪器管理路由 ====================
  // 获取仪器列表 (公开)
  router.get('/api/instruments', controller.instrument.index);

  // 获取仪器下拉选择列表 (公开)
  router.get('/api/instruments/options', controller.instrument.getInstrumentSelect);

  // 获取我的申请列表 (需要登录)
  router.get('/api/instruments/applications/my', jwtAuth, controller.instrument.getMyApplications);

  // 获取使用申请列表 (教师及以上)
  router.get('/api/instruments/applications', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrument.getApplications);

  // 获取仪器详情 (公开)
  router.get('/api/instruments/:id', controller.instrument.show);

  // 创建仪器 (教师及以上)
  router.post('/api/instruments', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrument.create);

  // 更新仪器信息 (教师及以上)
  router.post('/api/instruments/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrument.update);

  // 删除仪器 (管理员)
  router.delete('/api/instruments/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.instrument.destroy);

  // 申请使用仪器 (需要登录)
  router.post('/api/instruments/apply/:id', jwtAuth, controller.instrument.apply);

  // 审核使用申请 (教师及以上)
  router.post('/api/instruments/applications/review/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrument.reviewApplication);

  // ==================== 仪器申请路由 ====================
  // 获取申请列表 (教师及以上)
  router.get('/api/instrument-applications', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrumentApplication.index);

  // 创建申请 (需要登录)
  router.post('/api/instrument-applications', jwtAuth, controller.instrumentApplication.create);

  // 审核申请 (教师及以上)
  router.put('/api/instrument-applications/review/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.instrumentApplication.review);

  // ==================== 维修管理路由 ====================
  // 获取维修记录 (管理员)
  router.get('/api/repairs', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.repair.index);

  // 获取我的维修记录 (需要登录)
  router.get('/api/repairs/my', jwtAuth, controller.repair.getMyRepairs);

  // 报告仪器故障 (需要登录)
  router.post('/api/repairs/instruments/:instrumentId', jwtAuth, controller.repair.report);

  // 更新维修状态 (管理员)
  router.post('/api/repairs/update/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.repair.updateRepairStatus);

  // ==================== 新闻公告路由 ====================
  // 获取新闻列表 (公开)
  router.get('/api/news', controller.news.index);

  // 获取待审核新闻 (管理员)
  router.get('/api/news/pending', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.news.getPendingNews);

  // 获取新闻详情 (公开)
  router.get('/api/news/:id', controller.news.show);

  // 发布新闻 (教师及以上)
  router.post('/api/news', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.news.create);

  // 点赞新闻 (需要登录)
  router.post('/api/news/:id/like', jwtAuth, controller.news.like);

  // 审核新闻 (管理员)
  router.patch('/api/news/:id/review', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.news.review);

  // 更新新闻 (教师及以上)
  router.put('/api/news/:id', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.news.update);

  // 删除新闻 (管理员)
  router.delete('/api/news/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.news.destroy);

  // ==================== 通知管理路由 ====================
  // 创建通知 (需要登录)
  router.post('/api/notifications', jwtAuth, controller.notification.create);

  // 获取我的通知 (需要登录)
  router.get('/api/notifications', jwtAuth, controller.notification.index);

  // 获取未读数量 (需要登录)
  router.get('/api/notifications/unread-count', jwtAuth, controller.notification.getUnreadCount);

  // 获取所有通知 (管理员)
  router.get('/api/notifications/all', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.notification.findAllNotifications);

  // 标记为已读 (需要登录)
  router.put('/api/notifications/read/:id', jwtAuth, controller.notification.markAsRead);

  // 全部标记为已读 (需要登录)
  router.patch('/api/notifications/read-all', jwtAuth, controller.notification.markAllAsRead);

  // 删除通知 (需要登录)
  router.delete('/api/notifications/:id', jwtAuth, controller.notification.remove);

  // ==================== 收藏管理路由 ====================
  // 切换收藏状态实验室 (需要登录)
  router.post('/api/favorites/appointments/:labId', jwtAuth, controller.favorite.toggle);

  // 获取我的收藏实验室 (需要登录)
  router.get('/api/favorites/appointments', jwtAuth, controller.favorite.getMyFavorites);

  // 获取收藏列表 (需要登录)
  router.get('/api/favorites', jwtAuth, controller.favorite.index);

  // 添加收藏 (需要登录)
  router.post('/api/favorites', jwtAuth, controller.favorite.create);

  // 删除收藏 (需要登录)
  router.delete('/api/favorites/:id', jwtAuth, controller.favorite.destroy);

  // ==================== 评价管理路由 ====================
  // 获取评价列表 (公开)
  router.get('/api/evaluations', controller.evaluation.index);

  // 提交实验室评价 (需要登录)
  router.post('/api/evaluations', jwtAuth, controller.evaluation.create);

  // 获取实验室评价 (公开)
  router.get('/api/evaluations/lab/:labId', controller.evaluation.findByLab);

  // 获取实验室评价统计 (公开)
  router.get('/api/evaluations/lab/:labId/statistics', controller.evaluation.getStatistics);

  // 更新评价 (需要登录)
  router.put('/api/evaluations/:id', jwtAuth, controller.evaluation.update);

  // 删除评价 (需要登录)
  router.delete('/api/evaluations/:id', jwtAuth, controller.evaluation.destroy);

  // ==================== 轮播图类型路由 ====================
  // 创建轮播图类型 (管理员)
  router.post('/api/banners/types', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.banner.createType);

  // 获取所有轮播图类型 (公开)
  router.get('/api/banners/types', controller.banner.findAllTypes);

  // 获取轮播图类型详情 (公开)
  router.get('/api/banners/types/:id', controller.banner.findOneType);

  // 更新轮播图类型 (管理员)
  router.post('/api/banners/types/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.banner.updateType);

  // 删除轮播图类型 (管理员)
  router.delete('/api/banners/types/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.banner.removeType);

  // ==================== 轮播图路由 ====================
  // 创建轮播图 (管理员)
  router.post('/api/banners', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.banner.createBanner);

  // 获取轮播图列表 (公开)
  router.get('/api/banners', controller.banner.findAllBanners);

  // 获取轮播图详情 (公开)
  router.get('/api/banners/:id', controller.banner.findOneBanner);

  // 更新轮播图信息 (管理员)
  router.post('/api/banners/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.banner.updateBanner);

  // 删除轮播图 (管理员)
  router.delete('/api/banners/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.banner.removeBanner);
};
