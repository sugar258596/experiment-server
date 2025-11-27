'use strict';

const Service = require('egg').Service;
const bcrypt = require('bcryptjs');

/**
 * 认证服务
 * 处理用户注册、登录等认证相关业务逻辑
 */
class AuthService extends Service {
  /**
   * 用户注册
   * @param {Object} data 注册数据
   * @param {string} data.username 用户名
   * @param {string} data.password 密码
   * @param {string} data.email 邮箱
   * @param {string} data.phone 手机号
   * @param {string} data.role 角色
   * @returns {Promise<Object>} 包含 token 的对象
   */
  async register(data) {
    const { username, password, email, phone, role = 'STUDENT' } = data;

    // 检查用户名是否已存在
    const existingUserByUsername = await this.ctx.model.User.findOne({
      where: { username },
    });

    if (existingUserByUsername) {
      this.ctx.throw(400, '用户名已存在');
    }

    // 检查邮箱是否已存在(仅当邮箱不为空时检查)
    if (email) {
      const existingUserByEmail = await this.ctx.model.User.findOne({
        where: { email },
      });

      if (existingUserByEmail) {
        this.ctx.throw(400, '邮箱已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = await this.ctx.model.User.create({
      username,
      password: hashedPassword,
      email,
      phone,
      role,
      status: 0, // 0-正常
    });

    // 生成 token
    const token = this.generateToken(user);

    return {
      token,
    };
  }

  /**
   * 用户登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @returns {Promise<Object>} 包含 token 的对象
   */
  async login(username, password) {
    // 查找用户
    const user = await this.ctx.model.User.findOne({
      where: { username },
    });

    if (!user) {
      this.ctx.throw(401, '用户名或密码错误');
    }

    // 检查密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.ctx.throw(401, '用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 0) {
      this.ctx.throw(401, '账号已被禁用');
    }

    // 生成 token
    const token = this.generateToken(user);

    return {
      token,
    };
  }

  /**
   * 生成 JWT Token
   * @param {Object} user 用户对象
   * @returns {string} JWT token
   * @private
   */
  generateToken(user) {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      email: user.email,
      status: user.status,
    };

    return this.app.jwt.sign(
      payload,
      this.app.config.jwt.secret,
      { expiresIn: '24h' }
    );
  }
}

module.exports = AuthService;
