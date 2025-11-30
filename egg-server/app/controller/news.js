'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 新闻管理
 */
class NewsController extends Controller {
  /**
   * @summary 获取新闻列表
   * @description 查询所有新闻
   * @router get /api/news
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const result = await ctx.service.news.findAll(ctx.query);
    ctx.body = { success: true, data: result.data, total: result.total };
  }

  /**
   * @summary 获取新闻详情
   * @description 根据ID获取新闻信息
   * @router get /api/news/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const news = await ctx.service.news.findOne(ctx.params.id);
    ctx.body = { success: true, data: news };
  }

  /**
   * @summary 创建新闻
   * @description 创建新新闻，支持上传封面图片和最多10张新闻图片
   * @router post /api/news
   * @request formData file coverImage 封面图片（单张）
   * @request formData file[] images 新闻图片（最多10张）
   * @apikey
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;

    try {
      // 获取上传的文件
      const files = ctx.request.files || [];
      const body = ctx.request.body;

      const news = await ctx.service.news.createWithFiles(body, files, ctx.state.user);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = news
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }


  /**
   * @summary 点赞新闻
   * @description 点赞指定新闻
   * @router post /api/news/{id}/like
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 点赞成功
   */
  async like() {
    const { ctx } = this;
    const newsId = parseInt(ctx.params.id);
    const news = await ctx.service.news.like(newsId);

    ctx.body = {
      success: true,
      message: '点赞成功',
    };
  }

  /**
   * @summary 审核新闻
   * @description 审核新闻发布申请(仅管理员可操作)
   * @router patch /api/news/{id}/review
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 审核完成
   */
  async review() {
    const { ctx } = this;
    const newsId = parseInt(ctx.params.id);
    const { approved } = ctx.request.body;
    const news = await ctx.service.news.review(newsId, approved, ctx.state.user);

    ctx.body = news;
  }

  /**
   * @summary 更新新闻
   * @description 更新新闻内容（只有作者或管理员可操作），支持上传封面图片和最多10张新闻图片
   * @router put /api/news/{id}
   * @request path string *id
   * @request formData file coverImage 封面图片（单张）
   * @request formData file[] images 新闻图片（最多10张）
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;

    try {
      const newsId = parseInt(ctx.params.id);
      const files = ctx.request.files || [];
      const body = ctx.request.body;

      const news = await ctx.service.news.updateWithFiles(newsId, body, files, ctx.state.user);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = news
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 删除新闻
   * @description 删除新闻（软删除，只有作者或管理员可操作）
   * @router delete /api/news/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const newsId = parseInt(ctx.params.id);
    const result = await ctx.service.news.remove(newsId, ctx.state.user);

    ctx.body = { success: true, ...result };
  }
}

module.exports = NewsController;
