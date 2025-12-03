'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 收藏管理
 */
class FavoriteController extends Controller {
  /**
   * @summary 获取收藏列表
   * @description 查询当前用户的所有收藏
   * @router get /api/favorites
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const result = await ctx.service.favorite.findAll(ctx.state.user.sub);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 添加收藏
   * @description 添加实验室到收藏
   * @router post /api/favorites
   * @request body createFavoriteBody *body
   * @response 200 baseResponse 添加成功
   */
  async create() {
    const { ctx } = this;
    const result = await ctx.service.favorite.create(
      ctx.state.user.sub,
      ctx.request.body.labId
    );
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 删除收藏
   * @description 根据ID删除收藏
   * @router delete /api/favorites/{id}
   * @request path string *id
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const result = await ctx.service.favorite.remove(ctx.params.id);
    ctx.body = { success: true, message: result.message };
  }

  /**
   * @summary 切换收藏状态实验室
   * @description 切换实验室的收藏状态，如果已收藏则取消，如果未收藏则添加
   * @router post /api/favorites/appointments/{labId}
   * @request path string *labId
   * @apikey
   * @response 200 baseResponse 操作成功
   */
  async toggle() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const labId = parseInt(ctx.params.labId);

    const result = await ctx.service.favorite.toggle(userId, labId);

    ctx.body = {
      success: true,
      message: result.message,
      data: result,
    };
  }

  /**
   * @summary 获取我的收藏实验室
   * @description 查询当前用户收藏的所有实验室
   * @router get /api/favorites/appointments
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getMyFavorites() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;

    const result = await ctx.service.favorite.getMyFavorites(userId, ctx.query);

    ctx.body = result
  }
}

module.exports = FavoriteController;
