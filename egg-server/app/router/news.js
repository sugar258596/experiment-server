'use strict';

/**
 * 动态路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

  // 获取我点赞的动态 (需要登录) - 必须在 /api/news/:id 之前
  router.get('/api/news/my/likes', jwtAuth, controller.news.getMyLikes);

  // 获取我收藏的动态 (需要登录) - 必须在 /api/news/:id 之前
  router.get('/api/news/my/favorites', jwtAuth, controller.news.getMyFavorites);

  // 获取动态列表 (公开，但会尝试获取用户信息)
  router.get('/api/news', jwtAuth, controller.news.index);

  // 获取动态详情 (公开，但会尝试获取用户信息)
  router.get('/api/news/:id', jwtAuth, controller.news.show);

  // 发布动态 (教师及以上)
  router.post('/api/news', jwtAuth, roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'), controller.news.create);

  // 切换点赞状态 (需要登录)
  router.post('/api/news/:id/like', jwtAuth, controller.news.like);

  // 切换收藏状态 (需要登录)
  router.post('/api/news/:id/favorite', jwtAuth, controller.news.favorite);

  // 审核动态 (管理员)
  router.patch('/api/news/:id/review', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), controller.news.review);

  // 更新动态 (需要登录)
  router.put('/api/news/:id', jwtAuth, controller.news.update);

  // 删除动态 (需要登录)
  router.delete('/api/news/:id', jwtAuth, controller.news.destroy);
};
