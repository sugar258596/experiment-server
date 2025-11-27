'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 通知管理
 */
class NotificationController extends Controller {
  /**
   * @summary 获取通知列表
   * @description 查询当前用户的所有通知
   * @router get /api/notifications
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const notifications = await ctx.service.notification.findByUser(ctx.state.user.sub);
    ctx.body = notifications;
  }

  /**
   * @summary 标记通知为已读
   * @description 根据ID标记通知为已读
   * @router put /api/notifications/read/{id}
   * @request path string *id
   * @response 200 baseResponse 标记成功
   */
  async markAsRead() {
    const { ctx } = this;
    const notification = await ctx.service.notification.markAsRead(ctx.params.id, ctx.state.user.sub);
    ctx.body = { success: true, data: notification };
  }

  /**
   * @summary 创建通知
   * @description 创建新的通知
   * @router post /api/notifications
   * @apikey
   * @response 201 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;
    const { userId, title, content, type } = ctx.request.body;

    const notification = await ctx.service.notification.create({
      userId,
      title,
      content,
      type,
      isRead: false,
    });

    ctx.body = {
      success: true,
      data: notification,
      message: '通知创建成功',
    };
  }

  /**
   * @summary 获取未读数量
   * @description 查询当前用户的未读通知数量
   * @router get /api/notifications/unread-count
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getUnreadCount() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const count = await ctx.service.notification.getUnreadCount(userId);

    ctx.body = {
      success: true,
      data: { count },
    };
  }

  /**
   * @summary 获取所有通知（管理员专用）
   * @description 查询所有通知（仅管理员可查看）
   * @router get /api/notifications/all
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async findAllNotifications() {
    const { ctx } = this;
    const result = await ctx.service.notification.findAll(ctx.query);

    ctx.body = {
      success: true,
      data: result.data,
      total: result.total,
    };
  }

  /**
   * @summary 全部标记为已读
   * @description 将当前用户所有未读通知标记为已读
   * @router patch /api/notifications/read-all
   * @apikey
   * @response 200 baseResponse 标记成功
   */
  async markAllAsRead() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const result = await ctx.service.notification.markAllAsRead(userId);

    ctx.body = {
      success: true,
      message: result.message,
    };
  }

  /**
   * @summary 删除通知
   * @description 删除指定通知
   * @router delete /api/notifications/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 删除成功
   */
  async remove() {
    const { ctx } = this;
    const notificationId = parseInt(ctx.params.id);
    const userId = ctx.state.user.sub;
    const result = await ctx.service.notification.remove(notificationId, userId);

    ctx.body = {
      success: true,
      message: result.message,
    };
  }
}

module.exports = NotificationController;
