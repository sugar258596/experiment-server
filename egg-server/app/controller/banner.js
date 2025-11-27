'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 轮播图管理
 */
class BannerController extends Controller {
  /**
   * @summary 创建轮播图类型
   * @description 创建新的轮播图类型（管理员及以上权限）
   * @router post /api/banners/types
   * @request body createBannerTypeBody *body
   * @apikey
   * @response 200 baseResponse 创建成功
   */
  async createType() {
    const { ctx } = this;
    ctx.validate({
      name: { type: 'string', required: true },
      description: { type: 'string', required: false },
    });

    const result = await ctx.service.banner.createType(ctx.request.body);
    ctx.body = result;
  }

  /**
   * @summary 获取所有轮播图类型
   * @description 查询所有轮播图类型列表
   * @router get /api/banners/types
   * @response 200 baseResponse 查询成功
   */
  async findAllTypes() {
    const { ctx } = this;
    const result = await ctx.service.banner.findAllTypes();
    ctx.body = result;
  }

  /**
   * @summary 获取轮播图类型详情
   * @description 根据ID获取轮播图类型详细信息
   * @router get /api/banners/types/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async findOneType() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const result = await ctx.service.banner.findOneType(id);
    ctx.body = result;
  }

  /**
   * @summary 更新轮播图类型
   * @description 根据ID更新轮播图类型信息（管理员及以上权限）
   * @router post /api/banners/types/{id}
   * @request path string *id
   * @request body updateBannerTypeBody *body
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async updateType() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const result = await ctx.service.banner.updateType(id, ctx.request.body);
    ctx.body = result;
  }

  /**
   * @summary 删除轮播图类型
   * @description 根据ID删除轮播图类型（软删除，管理员及以上权限）
   * @router delete /api/banners/types/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 删除成功
   */
  async removeType() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const result = await ctx.service.banner.removeType(id);
    ctx.body = result;
  }

  /**
   * @summary 创建轮播图
   * @description 创建新的轮播图（管理员及以上权限），支持上传最多10张图片
   * @router post /api/banners
   * @request body createBannerBody *body
   * @apikey
   * @response 200 baseResponse 创建成功
   */
  async createBanner() {
    const { ctx } = this;
    const files = ctx.request.files || [];
    const result = await ctx.service.banner.createBanner(ctx.request.body, files);
    ctx.body = result;
  }

  /**
   * @summary 获取轮播图列表
   * @description 查询所有轮播图，支持按类型筛选
   * @router get /api/banners
   * @request query string typeId 轮播图类型ID
   * @response 200 baseResponse 查询成功
   */
  async findAllBanners() {
    const { ctx } = this;
    const typeId = ctx.query.typeId ? parseInt(ctx.query.typeId) : undefined;
    const result = await ctx.service.banner.findAllBanners(typeId);
    ctx.body = result;
  }

  /**
   * @summary 获取轮播图详情
   * @description 根据ID获取轮播图详细信息
   * @router get /api/banners/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async findOneBanner() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const result = await ctx.service.banner.findOneBanner(id);
    ctx.body = result;
  }

  /**
   * @summary 更新轮播图信息
   * @description 根据ID更新轮播图信息（管理员及以上权限）
   * @router post /api/banners/{id}
   * @request path string *id
   * @request body updateBannerBody *body
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async updateBanner() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const files = ctx.request.files || [];
    const result = await ctx.service.banner.updateBanner(id, ctx.request.body, files);
    ctx.body = result;
  }

  /**
   * @summary 删除轮播图
   * @description 根据ID删除轮播图（软删除，管理员及以上权限）
   * @router delete /api/banners/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 删除成功
   */
  async removeBanner() {
    const { ctx } = this;
    const id = parseInt(ctx.params.id);
    const result = await ctx.service.banner.removeBanner(id);
    ctx.body = result;
  }
}

module.exports = BannerController;
