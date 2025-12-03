'use strict';

/**
 * 通知管理路由模块
 * @param {Egg.Application} app
 */
module.exports = app => {
  const { router, controller } = app;
  const roles = app.middleware.roles;
  const jwtAuth = app.middleware.jwtAuth();

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
};
