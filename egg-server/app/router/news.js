'use strict';

/**
 * 新闻公告路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取新闻列表 (公开)
  router.get('/api/news', controller.news.index);

  // 获取新闻详情 (公开)
  router.get('/api/news/:id', controller.news.show);

  // 发布新闻 (教师及以上)
  router.post('/api/news', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.news.create);

  // 点赞新闻 (需要登录) - 必须在 /api/news/:id 之前
  router.post('/api/news/like/:id', jwtAuth, controller.news.like);

  // 审核新闻 (管理员) - 必须在 /api/news/:id 之前
  router.patch('/api/news/review/:id', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.news.review);

  // 更新新闻 (需要登录)
  router.post('/api/news/:id', jwtAuth, controller.news.update);

  // 删除新闻 (需要登录)
  router.delete('/api/news/:id', jwtAuth, controller.news.destroy);
};
