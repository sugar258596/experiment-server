'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 用户管理
 */
class UserController extends Controller {
  /**
   * @summary 获取用户列表
   * @description 查询所有用户
   * @router get /api/user
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const user = await ctx.service.user.findAll();
    ctx.body = {
      success: true,
      data: user,
    };
  }

  /**
   * @summary 获取用户详情
   * @description 根据ID获取用户信息
   * @router get /api/user/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const user = await ctx.service.user.findById(ctx.params.id);
    ctx.body = {
      success: true,
      data: user,
    };
  }

  /**
   * @summary 创建用户
   * @description 创建新用户，支持上传头像
   * @router post /api/user
   * @request body createUserBody *body
   * @apikey
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;

    try {
      // 获取上传的文件
      const files = ctx.request.files || [];

      // 获取其他表单数据
      const userData = ctx.request.body;

      const user = await ctx.service.user.create(userData, files);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = user
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 更新用户
   * @description 根据ID更新用户信息，支持上传头像
   * @router put /api/user/{id}
   * @request path string *id
   * @request body updateUserBody *body
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;

    try {
      const userId = parseInt(ctx.params.id);

      // 获取上传的文件
      const files = ctx.request.files || [];

      // 获取其他表单数据
      const updateData = ctx.request.body;

      const user = await ctx.service.user.update(userId, updateData, files);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = user
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 更新个人信息
   * @description 用户更新自己的个人信息，支持上传头像
   * @router post /api/user/profile
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async updateProfile() {
    const { ctx } = this;

    try {
      const userId = ctx.state.user.sub;

      // 获取上传的文件
      const files = ctx.request.files || [];

      // 获取其他表单数据
      const updateData = ctx.request.body;

      const user = await ctx.service.user.updateProfile(userId, updateData, files);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = user
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 管理员更新用户信息
   * @description 管理员更新用户信息，可以修改角色、状态等，支持上传头像
   * @router patch /api/user/admin/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 更新成功
   */
  async updateByAdmin() {
    const { ctx } = this;

    try {
      const userId = parseInt(ctx.params.id);

      // 获取上传的文件
      const files = ctx.request.files || [];

      // 获取其他表单数据
      const updateData = ctx.request.body;

      const result = await ctx.service.user.updateByAdmin(userId, updateData, files);

      // 清理临时文件
      ctx.cleanupRequestFiles();

      ctx.body = result;
    } catch (error) {
      ctx.cleanupRequestFiles();
      throw error;
    }
  }

  /**
   * @summary 删除用户
   * @description 根据ID删除用户
   * @router delete /api/user/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 删除成功
   */
  async destroy() {
    const { ctx } = this;
    const result = await ctx.service.user.delete(ctx.params.id);
    ctx.body = {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 检查用户名或邮箱是否存在
   * @description 检查用户名或邮箱是否已被注册，用于注册时验证
   * @router post /api/user/check-existence
   * @response 200 baseResponse 检查成功
   */
  async checkExistence() {
    const { ctx } = this;
    const { username, email } = ctx.request.body;
    const result = await ctx.service.user.checkExistence(username, email);

    ctx.body = {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 获取当前用户信息
   * @description 获取当前登录用户的详细信息
   * @router get /api/user/info
   * @apikey
   * @response 200 baseResponse 获取成功
   */
  async getProfile() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const user = await ctx.service.user.getProfile(userId);

    ctx.body = {
      success: true,
      data: user,
    };
  }

  /**
   * @summary 修改密码
   * @description 修改当前用户的密码
   * @router post /api/user/change-password
   * @request body changePasswordBody *body
   * @apikey
   * @response 200 baseResponse 修改成功
   */
  async changePassword() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;
    const { oldPassword, newPassword, confirmPassword } = ctx.request.body;

    // 验证必填字段
    if (!oldPassword || !newPassword || !confirmPassword) {
      ctx.throw(400, '原密码、新密码和确认密码不能为空');
    }

    const result = await ctx.service.user.changePassword(
      userId,
      oldPassword,
      newPassword,
      confirmPassword
    );

    ctx.body = result;
  }
}

module.exports = UserController;
