'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 仪器申请管理
 */
class InstrumentApplicationController extends Controller {
  /**
   * @summary 获取仪器申请列表
   * @description 查询所有仪器申请（教师只能看到自己创建的实验室下的仪器申请）
   * @router get /api/instrument-applications
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const reviewerId = ctx.state.user.sub;
    const reviewerRole = ctx.state.user.role;
    const result = await ctx.service.instrumentApplication.findAll(ctx.query, reviewerId, reviewerRole);
    ctx.body = {
      success: true,
      data: result.list,
      list: result.list,
      total: result.total,
    };
  }

  /**
   * @summary 获取我的仪器申请列表
   * @description 获取当前用户的仪器申请列表
   * @router get /api/instrument-applications/my
   * @response 200 baseResponse 查询成功
   */
  async my() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const result = await ctx.service.instrumentApplication.findByUserId(userId, ctx.query);
    ctx.body = {
      success: true,
      data: result.list,
      list: result.list,
      total: result.total,
    };
  }

  /**
   * @summary 创建仪器申请
   * @description 创建新仪器申请
   * @router post /api/instrument-applications
   * @request body createInstrumentApplicationBody *body
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;
    const application = await ctx.service.instrumentApplication.create(ctx.request.body);
    ctx.body = { success: true, data: application };
  }

  /**
   * @summary 申请使用仪器
   * @description 申请使用指定的仪器设备
   * @router post /api/instrument-applications/apply/{id}
   * @request path string *id
   * @apikey
   * @response 201 baseResponse 申请提交成功
   */
  async apply() {
    const { ctx } = this;
    const instrumentId = parseInt(ctx.params.id);
    const user = ctx.state.user;
    const result = await ctx.service.instrumentApplication.apply(instrumentId, user, ctx.request.body);
    ctx.body = result;
  }

  /**
   * @summary 取消仪器申请
   * @description 取消自己的仪器申请(仅待审核状态可取消)
   * @router delete /api/instrument-applications/{id}
   * @request path string *id
   * @response 200 baseResponse 取消成功
   */
  async cancel() {
    const { ctx } = this;
    const applicationId = parseInt(ctx.params.id);
    const userId = ctx.state.user.sub;
    const result = await ctx.service.instrumentApplication.cancel(applicationId, userId);
    ctx.body = result;
  }

  /**
   * @summary 审核仪器申请
   * @description 审核仪器使用申请(仅教师和管理员可操作)
   * @router post /api/instrument-applications/{id}
   * @request path string *id
   * @request body reviewInstrumentApplicationBody *body
   * @response 200 baseResponse 审核成功
   */
  async review() {
    const { ctx } = this;
    const applicationId = parseInt(ctx.params.id);
    const reviewer = ctx.state.user;
    const result = await ctx.service.instrumentApplication.reviewApplication(applicationId, reviewer, ctx.request.body);
    ctx.body = result;
  }
}

module.exports = InstrumentApplicationController;
