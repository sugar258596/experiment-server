'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 实验室管理
 */
class LabController extends Controller {
  /**
   * @summary 获取实验室列表
   * @description 查询所有实验室
   * @router get /api/labs
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const labs = await ctx.service.lab.findAll(ctx.query);
    ctx.body = {
      success: true,
      data: labs,
    };
  }

  /**
   * @summary 获取实验室详情
   * @description 根据ID获取实验室信息
   * @router get /api/labs/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const lab = await ctx.service.lab.findById(ctx.params.id);
    ctx.body = {
      success: true,
      data: lab,
    };
  }

  /**
   * @summary 创建实验室
   * @description 创建新实验室，支持上传最多10张图片
   * @router post /api/labs
   * @request formData file[] images 实验室图片（最多10张）
   * @apikey
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;

    try {
      // 获取上传的文件
      const files = ctx.request.files || [];
      const body = ctx.request.body;

      const lab = await ctx.service.lab.createWithFiles(body, files);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = lab
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 更新实验室
   * @description 根据ID更新实验室信息，支持文件上传。图片自动检测模式：1. 仅上传文件-替换所有旧图片；2. 上传文件+传入images-混合模式；3. 仅传入images-保持/调整图片；4. 都不传-保持原样
   * @router post /api/labs/{id}
   * @request path string *id
   * @request formData file[] images 实验室图片（最多10张）
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;

    try {
      const files = ctx.request.files || [];
      const body = ctx.request.body;

      const lab = await ctx.service.lab.updateWithFiles(ctx.params.id, body, files);

      ctx.cleanupRequestFiles();

      ctx.body = {
        success: true,
        data: lab,
        message: 'Lab updated successfully',
      };
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 删除实验室
   * @description 根据ID删除实验室
   * @router delete /api/labs/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const result = await ctx.service.lab.delete(ctx.params.id);
    ctx.body = {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 获取热门实验室
   * @description 查询热门实验室列表
   * @router get /api/labs/popular
   * @response 200 baseResponse 查询成功
   */
  async getPopularLabs() {
    const { ctx } = this;
    const labs = await ctx.service.lab.getPopularLabs(ctx.query);

    ctx.body = {
      success: true,
      data: labs,
    };
  }

  /**
   * @summary 获取实验室下拉列表
   * @description 获取用于下拉选择的实验室简要信息(仅返回 id 和 name)
   * @router get /api/labs/options
   * @response 200 baseResponse 查询成功
   */
  async getOptions() {
    const { ctx } = this;
    const data = await ctx.service.lab.getOptions(ctx.query);

    ctx.body = {
      success: true,
      data: data.data,
      total: data.total,
    };
  }
}

module.exports = LabController;
