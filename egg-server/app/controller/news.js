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
   * @description 创建新新闻
   * @router post /api/news
   * @request body createNewsBody *body
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;
    const news = await ctx.service.news.create(ctx.request.body, ctx.state.user);
    ctx.body = { success: true, data: news };
  }

  /**
   * @summary 更新新闻
   * @description 根据ID更新新闻信息
   * @router put /api/news/{id}
   * @request path string *id
   * @request body updateNewsBody *body
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;
    const news = await ctx.service.news.update(ctx.params.id, ctx.request.body);
    ctx.body = { success: true, data: news };
  }

  /**
   * @summary 删除新闻
   * @description 根据ID删除新闻
   * @router delete /api/news/{id}
   * @request path string *id
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const result = await ctx.service.news.remove(ctx.params.id);
    ctx.body = { success: true, message: result.message };
  }

  /**
   * @summary 获取待审核新闻
   * @description 查询待审核的新闻(仅管理员可查看)
   * @router get /api/news/pending
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getPendingNews() {
    const { ctx } = this;
    const news = await ctx.service.news.getPendingNews();

    ctx.body = {
      success: true,
      data: news,
    };
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
      data: {
        likes: news.likes,
      },
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

    ctx.body = {
      success: true,
      message: '审核完成',
      data: news,
    };
  }
}

module.exports = NewsController;
