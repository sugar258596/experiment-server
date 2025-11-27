'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 用户认证
 */
class AuthController extends Controller {
  /**
   * @summary 用户注册
   * @description 注册新用户账号
   * @router post /api/auth/register
   * @request body registerBody *body
   * @response 200 baseResponse 注册成功
   */
  async register() {
    const { ctx } = this;

    ctx.validate({
      username: { type: 'string', required: true },
      password: { type: 'string', required: true, min: 6 },
      email: { type: 'email', required: false },
    });

    const user = await ctx.service.auth.register(ctx.request.body);
    // 全局响应拦截器会自动格式化响应
    ctx.body = {
      ...user,
      message: '注册成功',
    };
  }

  /**
   * @summary 用户登录
   * @description 用户登录验证
   * @router post /api/auth/login
   * @request body loginBody *body
   * @response 200 baseResponse 登录成功
   */
  async login() {
    const { ctx } = this;

    ctx.validate({
      username: { type: 'string', required: true },
      password: { type: 'string', required: true },
    });

    const { username, password } = ctx.request.body;
    const result = await ctx.service.auth.login(username, password);

    // 全局响应拦截器会自动格式化响应
    ctx.body = {
      ...result,
      message: '登录成功',
    };
  }

  /**
   * @summary 用户登出
   * @description 用户退出登录
   * @router post /api/auth/logout
   * @apikey
   * @response 200 baseResponse 登出成功
   */
  async logout() {
    const { ctx } = this;
    // 全局响应拦截器会自动格式化响应
    ctx.body = {
      message: '登出成功',
    };
  }
}

module.exports = AuthController;
