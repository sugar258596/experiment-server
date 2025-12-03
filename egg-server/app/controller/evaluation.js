'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 评价管理
 */
class EvaluationController extends Controller {
  /**
   * @summary 获取评价列表
   * @router get /api/evaluations
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const { type } = ctx.query;
    const query = {};
    if (type !== undefined) {
      query.type = parseInt(type);
    }
    const result = await ctx.service.evaluation.findAll(query);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 创建实验室评论（支持图片上传）
   * @router post /api/evaluations/lab
   * @response 200 baseResponse 创建成功
   */
  async createLabEvaluation() {
    const { ctx } = this;
    const files = ctx.request.files || [];
    const body = ctx.request.body;

    // 处理上传的图片
    const images = [];
    for (const file of files) {
      const result = await ctx.service.evaluation.uploadImage(file);
      images.push(result);
    }

    const data = {
      appointmentId: parseInt(body.appointmentId),
      overallRating: parseInt(body.overallRating),
      equipmentRating: body.equipmentRating ? parseInt(body.equipmentRating) : null,
      environmentRating: body.environmentRating ? parseInt(body.environmentRating) : null,
      serviceRating: body.serviceRating ? parseInt(body.serviceRating) : null,
      comment: body.comment || '',
      images,
    };

    const result = await ctx.service.evaluation.createLabEvaluation(
      { sub: ctx.state.user.sub },
      data
    );
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 创建仪器评价（支持图片上传）
   * @router post /api/evaluations/instrument
   * @response 200 baseResponse 创建成功
   */
  async createInstrumentEvaluation() {
    const { ctx } = this;
    const files = ctx.request.files || [];
    const body = ctx.request.body;

    // 处理上传的图片
    const images = [];
    for (const file of files) {
      const result = await ctx.service.evaluation.uploadImage(file);
      images.push(result);
    }

    const data = {
      instrumentApplicationId: parseInt(body.instrumentApplicationId),
      overallRating: parseInt(body.overallRating),
      serviceRating: body.serviceRating ? parseInt(body.serviceRating) : null,
      comment: body.comment || '',
      images,
    };

    const result = await ctx.service.evaluation.createInstrumentEvaluation(
      { sub: ctx.state.user.sub },
      data
    );
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 删除评价
   * @router delete /api/evaluations/{id}
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const result = await ctx.service.evaluation.remove(
      { sub: ctx.state.user.sub },
      parseInt(ctx.params.id)
    );
    ctx.body = { success: true, message: result.message };
  }

  /**
   * @summary 获取实验室评论列表
   * @router get /api/evaluations/lab/{labId}
   * @response 200 baseResponse 查询成功
   */
  async findByLab() {
    const { ctx } = this;
    const labId = parseInt(ctx.params.labId);
    const result = await ctx.service.evaluation.findByLab(labId);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 获取仪器评价列表
   * @router get /api/evaluations/instrument/{instrumentId}
   * @response 200 baseResponse 查询成功
   */
  async findByInstrument() {
    const { ctx } = this;
    const instrumentId = parseInt(ctx.params.instrumentId);
    const result = await ctx.service.evaluation.findByInstrument(instrumentId);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 根据预约ID获取实验室评论
   * @router get /api/evaluations/appointment/{appointmentId}
   * @response 200 baseResponse 查询成功
   */
  async findByAppointment() {
    const { ctx } = this;
    const appointmentId = parseInt(ctx.params.appointmentId);
    const result = await ctx.service.evaluation.findByAppointmentId(appointmentId);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 根据仪器申请ID获取评价
   * @router get /api/evaluations/instrument-application/{applicationId}
   * @response 200 baseResponse 查询成功
   */
  async findByInstrumentApplication() {
    const { ctx } = this;
    const applicationId = parseInt(ctx.params.applicationId);
    const result = await ctx.service.evaluation.findByInstrumentApplicationId(applicationId);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 获取实验室评价统计
   * @router get /api/evaluations/lab/{labId}/statistics
   * @response 200 baseResponse 查询成功
   */
  async getLabStatistics() {
    const { ctx } = this;
    const labId = parseInt(ctx.params.labId);
    const result = await ctx.service.evaluation.getLabStatistics(labId);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 获取仪器评价统计
   * @router get /api/evaluations/instrument/{instrumentId}/statistics
   * @response 200 baseResponse 查询成功
   */
  async getInstrumentStatistics() {
    const { ctx } = this;
    const instrumentId = parseInt(ctx.params.instrumentId);
    const result = await ctx.service.evaluation.getInstrumentStatistics(instrumentId);
    ctx.body = { success: true, data: result };
  }
}

module.exports = EvaluationController;
