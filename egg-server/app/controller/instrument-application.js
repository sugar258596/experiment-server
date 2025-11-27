'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 仪器申请管理
 */
class InstrumentApplicationController extends Controller {
  /**
   * @summary 获取仪器申请列表
   * @description 查询所有仪器申请
   * @router get /api/instrument-applications
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const applications = await ctx.service.instrumentApplication.findAll();
    ctx.body = { success: true, data: applications };
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
   * @summary 审核仪器申请
   * @description 审核仪器申请
   * @router put /api/instrument-applications/review/{id}
   * @request path string *id
   * @request body reviewInstrumentApplicationBody *body
   * @response 200 baseResponse 审核成功
   */
  async review() {
    const { ctx } = this;
    const reviewerId = ctx.state.user.sub;
    const application = await ctx.service.instrumentApplication.review(
      ctx.params.id,
      ctx.request.body,
      reviewerId
    );
    ctx.body = { success: true, data: application };
  }
}

module.exports = InstrumentApplicationController;
