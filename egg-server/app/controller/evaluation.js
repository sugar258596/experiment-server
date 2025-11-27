'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 评价管理
 */
class EvaluationController extends Controller {
  /**
   * @summary 获取评价列表
   * @description 查询所有评价
   * @router get /api/evaluations
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const result = await ctx.service.evaluation.findAll();
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 创建评价
   * @description 创建新评价
   * @router post /api/evaluations
   * @request body createEvaluationBody *body
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;
    const result = await ctx.service.evaluation.create(
      { id: ctx.state.user.sub },
      ctx.request.body
    );
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 更新评价
   * @description 根据ID更新评价信息
   * @router put /api/evaluations/{id}
   * @request path string *id
   * @request body updateEvaluationBody *body
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;
    const result = await ctx.service.evaluation.update(ctx.params.id, ctx.request.body);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 删除评价
   * @description 根据ID删除评价
   * @router delete /api/evaluations/{id}
   * @request path string *id
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const result = await ctx.service.evaluation.remove(ctx.params.id);
    ctx.body = { success: true, message: result.message };
  }

  /**
   * @summary 获取实验室评价
   * @description 查询指定实验室的所有评价
   * @router get /api/evaluations/lab/{labId}
   * @request path string *labId
   * @response 200 baseResponse 查询成功
   */
  async findByLab() {
    const { ctx } = this;
    const labId = parseInt(ctx.params.labId);

    const result = await ctx.service.evaluation.findByLab(labId);

    ctx.body = {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 获取实验室评价统计
   * @description 查询指定实验室的评价统计数据
   * @router get /api/evaluations/lab/{labId}/statistics
   * @request path string *labId
   * @response 200 baseResponse 查询成功
   */
  async getStatistics() {
    const { ctx } = this;
    const labId = parseInt(ctx.params.labId);

    const result = await ctx.service.evaluation.getStatistics(labId);

    ctx.body = {
      success: true,
      data: result,
    };
  }
}

module.exports = EvaluationController;
