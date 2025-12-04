'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 问题反馈管理
 */
class FeedbackController extends Controller {
  /**
   * @summary 获取反馈列表
   * @description 获取当前用户相关的反馈列表，可按实验室ID筛选
   * @router get /api/feedbacks
   * @request query integer labId 实验室ID（可选）
   * @request query integer status 状态（可选）
   * @request query integer page 页码
   * @request query integer pageSize 每页数量
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const userRole = ctx.state.user.role;
    const result = await ctx.service.feedback.findAll(ctx.query, userId, userRole);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 获取反馈详情
   * @description 根据ID获取反馈详情
   * @router get /api/feedbacks/{id}
   * @request path integer *id 反馈ID
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const result = await ctx.service.feedback.findById(ctx.params.id);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 创建反馈
   * @description 对已通过的预约提交问题反馈
   * @router post /api/feedbacks
   * @request body createFeedbackBody *body
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const feedbackData = {
      ...ctx.request.body,
      userId,
    };
    const feedback = await ctx.service.feedback.create(feedbackData);
    ctx.body = { success: true, data: feedback };
  }

  /**
   * @summary 回复反馈
   * @description 实验室创建者或管理员回复反馈
   * @router post /api/feedbacks/{id}/reply
   * @request path integer *id 反馈ID
   * @request body replyFeedbackBody *body
   * @response 200 baseResponse 回复成功
   */
  async reply() {
    const { ctx } = this;
    const feedbackId = ctx.params.id;
    const userId = ctx.state.user.sub;
    const userRole = ctx.state.user.role;

    // 检查权限
    const canReply = await ctx.service.feedback.canReply(feedbackId, userId, userRole);
    if (!canReply) {
      ctx.throw(403, '您没有权限回复此反馈');
    }

    const replyData = {
      userId,
      content: ctx.request.body.content,
    };
    const reply = await ctx.service.feedback.reply(feedbackId, replyData);
    ctx.body = { success: true, data: reply };
  }

  /**
   * 更新反馈状态
   */
  async updateStatus() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const userRole = ctx.state.user.role;
    const { status } = ctx.request.body;
    const result = await ctx.service.feedback.updateStatus(ctx.params.id, status, userId, userRole);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 关闭反馈
   * @description 实验室创建者或管理员关闭反馈
   * @router patch /api/feedbacks/{id}/close
   * @request path integer *id 反馈ID
   * @response 200 baseResponse 关闭成功
   */
  async close() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const userRole = ctx.state.user.role;
    const result = await ctx.service.feedback.close(ctx.params.id, userId, userRole);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 删除反馈
   * @description 管理员删除反馈
   * @router delete /api/feedbacks/{id}
   * @request path integer *id 反馈ID
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const userRole = ctx.state.user.role;
    await ctx.service.feedback.delete(ctx.params.id, userId, userRole);
    ctx.body = { success: true, message: '删除成功' };
  }
}

module.exports = FeedbackController;
