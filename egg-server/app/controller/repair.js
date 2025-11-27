'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 维修管理
 */
class RepairController extends Controller {
  /**
   * @summary 获取维修列表
   * @description 查询所有维修记录
   * @router get /api/repairs
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const repairs = await ctx.service.repair.findAll();
    ctx.body = { success: true, data: repairs };
  }

  /**
   * @summary 报告仪器故障
   * @description 报告仪器设备故障并申请维修，支持上传最多5张图片
   * @router post /api/repairs/instruments/{instrumentId}
   * @request path string *instrumentId
   * @apikey
   * @response 201 baseResponse 报告提交成功
   */
  async report() {
    const { ctx } = this;
    const instrumentId = parseInt(ctx.params.instrumentId);
    const files = ctx.request.files || [];
    const reportData = ctx.request.body;

    const result = await ctx.service.repair.report(instrumentId, ctx.state.user, reportData, files);

    ctx.body = {
      success: true,
      data: result,
      message: '故障报告提交成功',
    };
  }

  /**
   * @summary 更新维修状态
   * @description 更新仪器维修状态(仅管理员可操作)
   * @router post /api/repairs/update/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async updateRepairStatus() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const updateData = ctx.request.body;

    const result = await ctx.service.repair.updateRepairStatus(id, updateData.status, updateData.summary);

    ctx.body = {
      success: true,
      data: result,
      message: '维修状态更新成功',
    };
  }

  /**
   * @summary 更新维修记录
   * @description 根据ID更新维修记录
   * @router put /api/repairs/{id}
   * @request path string *id
   * @request body updateRepairBody *body
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;
    const repair = await ctx.service.repair.update(ctx.params.id, ctx.request.body);
    ctx.body = { success: true, data: repair };
  }

  /**
   * @summary 获取我的维修记录
   * @description 查询当前登录用户提交的维修记录
   * @router get /api/repairs/my
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getMyRepairs() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const result = await ctx.service.repair.getMyRepairs(userId, ctx.query);

    ctx.body = {
      success: true,
      data: result,
    };
  }
}

module.exports = RepairController;
