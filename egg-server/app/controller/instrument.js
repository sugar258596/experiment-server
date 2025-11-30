'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 仪器管理
 */
class InstrumentController extends Controller {
  /**
   * @summary 获取仪器列表
   * @description 查询所有仪器
   * @router get /api/instruments
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const result = await ctx.service.instrument.findAll(ctx.query);
    ctx.body = result
  }

  /**
   * @summary 获取仪器详情
   * @description 根据ID获取仪器信息
   * @router get /api/instruments/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const instrument = await ctx.service.instrument.findOne(ctx.params.id);
    ctx.body = instrument
  }

  /**
   * @summary 创建仪器
   * @description 创建新仪器，支持上传最多10张图片
   * @router post /api/instruments
   * @request body createInstrumentBody *body
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;

    // 获取上传的文件
    const files = ctx.request.files || [];

    // 获取其他表单数据
    const instrumentData = ctx.request.body;

    const result = await ctx.service.instrument.createWithFiles(instrumentData, files);

    ctx.body = result
  }

  /**
   * @summary 更新仪器
   * @description 根据ID更新仪器信息，支持上传最多10张图片
   * @router patch /api/instruments/{id}
   * @request path string *id
   * @request body updateInstrumentBody *body
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);

    // 获取上传的文件
    const files = ctx.request.files || [];

    // 获取其他表单数据
    const updateData = ctx.request.body;

    const result = await ctx.service.instrument.updateWithFiles(id, updateData, files);

    ctx.body = result
  }

  /**
   * @summary 删除仪器
   * @description 根据ID删除仪器
   * @router delete /api/instruments/{id}
   * @request path string *id
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    await ctx.service.instrument.remove(ctx.params.id);
    ctx.body = { success: true, message: 'Instrument deleted' };
  }

  /**
   * @summary 获取仪器下拉选择列表
   * @description 获取可用仪器的下拉列表（仅返回id和name）
   * @router get /api/instruments/options
   * @response 200 baseResponse 查询成功
   */
  async getInstrumentSelect() {
    const { ctx } = this;
    const result = await ctx.service.instrument.getInstrumentSelect(ctx.query);

    ctx.body = result;
  }

  /**
   * @summary 获取我的申请列表
   * @description 查询当前登录用户的仪器使用申请
   * @router get /api/instruments/applications/my
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getMyApplications() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const result = await ctx.service.instrument.getMyApplications(userId, ctx.query);

    ctx.body = result
  }

  /**
   * @summary 获取使用申请列表
   * @description 查询仪器使用申请(教师及以上权限)
   * @router get /api/instruments/applications
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getApplications() {
    const { ctx } = this;
    const result = await ctx.service.instrument.getApplications(ctx.query);

    ctx.body = result
  }

  /**
   * @summary 申请使用仪器
   * @description 申请使用指定的仪器设备
   * @router post /api/instruments/apply/{id}
   * @request path string *id
   * @apikey
   * @response 201 baseResponse 申请提交成功
   */
  async apply() {
    const { ctx } = this;
    const instrumentId = parseInt(ctx.params.id);
    const user = ctx.state.user;
    const application = await ctx.service.instrument.apply(instrumentId, user, ctx.request.body);

    ctx.body = application
  }

  /**
   * @summary 审核使用申请
   * @description 审核仪器使用申请(仅教师和管理员可操作)
   * @router post /api/instruments/applications/review/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 审核完成
   */
  async reviewApplication() {
    const { ctx } = this;
    const applicationId = parseInt(ctx.params.id);
    const reviewer = ctx.state.user;
    const application = await ctx.service.instrument.reviewApplication(applicationId, reviewer, ctx.request.body);

    ctx.body = application
  }
}

module.exports = InstrumentController;
