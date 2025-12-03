'use strict';

/**
 * 收藏管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const jwtAuth = app.middleware.jwtAuth();

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
};
