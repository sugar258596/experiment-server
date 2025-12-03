'use strict';

/**
 * 轮播图路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

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
