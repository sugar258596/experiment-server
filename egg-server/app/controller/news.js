'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 新闻管理
 */
class NewsController extends Controller {
  /**
   * @summary 获取动态列表
   * @description 查询所有动态
   * @router get /api/news
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const userId = ctx.state.user?.sub || null;
    console.log('获取新闻列表 - 用户ID:', userId);
    const result = await ctx.service.news.findAll(ctx.query, userId);
    console.log('新闻列表结果示例:', result.list?.[0] ? {
      id: result.list[0].id,
      title: result.list[0].title,
      isLiked: result.list[0].dataValues?.isLiked,
      isFavorited: result.list[0].dataValues?.isFavorited,
    } : '无数据');
    ctx.body = result;
  }

  /**
   * @summary 获取动态详情
   * @description 根据ID获取动态信息
   * @router get /api/news/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const userId = ctx.state.user?.sub || null;
    const news = await ctx.service.news.findOne(ctx.params.id, userId);
    ctx.body = news;
  }

  /**
   * @summary 创建动态
   * @description 创建新动态，支持上传封面图片和最多10张动态图片（仅老师和管理员可操作）
   * @router post /api/news
   * @request formData file coverImage 封面图片（单张）
   * @request formData file[] images 动态图片（最多10张）
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

      ctx.body = news;
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 切换点赞状态
   * @description 切换动态的点赞状态，如果已点赞则取消，如果未点赞则添加
   * @router post /api/news/{id}/like
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 操作成功
   */
  async like() {
    const { ctx } = this;
    if (!ctx.state.user || !ctx.state.user.sub) {
      ctx.throw(401, '请先登录');
    }
    const newsId = parseInt(ctx.params.id);
    const userId = ctx.state.user.sub;
    const result = await ctx.service.news.toggleLike(newsId, userId);

    ctx.body = {
      success: true,
      ...result,
    };
  }

  /**
   * @summary 切换收藏状态
   * @description 切换动态的收藏状态，如果已收藏则取消，如果未收藏则添加
   * @router post /api/news/{id}/favorite
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 操作成功
   */
  async favorite() {
    const { ctx } = this;
    if (!ctx.state.user || !ctx.state.user.sub) {
      ctx.throw(401, '请先登录');
    }
    const newsId = parseInt(ctx.params.id);
    const userId = ctx.state.user.sub;
    const result = await ctx.service.news.toggleFavorite(newsId, userId);

    ctx.body = {
      success: true,
      ...result,
    };
  }

  /**
   * @summary 获取我点赞的动态
   * @description 查询当前用户点赞的所有动态
   * @router get /api/news/my/likes
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getMyLikes() {
    const { ctx } = this;
    if (!ctx.state.user || !ctx.state.user.sub) {
      ctx.throw(401, '请先登录');
    }
    const userId = ctx.state.user.sub;
    const result = await ctx.service.news.getMyLikes(userId, ctx.query);

    ctx.body = result;
  }

  /**
   * @summary 获取我收藏的动态
   * @description 查询当前用户收藏的所有动态
   * @router get /api/news/my/favorites
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getMyFavorites() {
    const { ctx } = this;
    if (!ctx.state.user || !ctx.state.user.sub) {
      ctx.throw(401, '请先登录');
    }
    const userId = ctx.state.user.sub;
    const result = await ctx.service.news.getMyFavorites(userId, ctx.query);

    ctx.body = result;
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
   * @summary 更新动态
   * @description 更新动态内容（只有作者或管理员可操作），支持上传封面图片和最多10张动态图片
   * @router put /api/news/{id}
   * @request path string *id
   * @request formData file coverImage 封面图片（单张）
   * @request formData file[] images 动态图片（最多10张）
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

      ctx.body = news;
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 删除动态
   * @description 删除动态（软删除，只有作者或管理员可操作）
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
