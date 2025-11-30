'use strict';

const Service = require('egg').Service;
const { generateFileUrl, deleteFile, saveFile, ALLOWED_IMAGE_TYPES } = require('../utils/upload');
const fs = require('fs');

class UserService extends Service {
  async findAll() {
    return this.ctx.model.User.findAll({
      attributes: { exclude: ['password'] },
    });
  }

  async findById(id) {
    const user = await this.ctx.model.User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      this.ctx.throw(404, 'User not found');
    }
    return user;
  }

  /**
   * 更新用户信息（支持头像上传）
   * @param {number} id - 用户ID
   * @param {Object} data - 更新数据
   * @param {Array} files - 上传的文件数组
   * @return {Promise<Object>} 更新后的用户信息
   */
  async update(id, data, files) {
    const user = await this.ctx.model.User.findByPk(id);
    if (!user) {
      this.ctx.throw(404, 'User not found');
    }

    const oldAvatar = user.avatar;

    // 如果更新用户名，需要检查新用户名是否已被其他用户使用
    if (data.username && data.username !== user.username) {
      const existingUser = await this.ctx.model.User.findOne({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== id) {
        this.ctx.throw(409, '用户名已被其他用户使用');
      }
    }

    // 如果更新邮箱，需要检查新邮箱是否已被其他用户使用
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.ctx.model.User.findOne({
        where: { email: data.email },
      });

      if (existingEmail && existingEmail.id !== id) {
        this.ctx.throw(409, '邮箱已被其他用户使用');
      }
    }

    // 处理头像上传逻辑
    let finalAvatar = oldAvatar;
    let shouldDeleteOldAvatar = false;

    // 情况1：上传了新文件
    if (files && files.length > 0) {
      if (files.length > 1) {
        this.ctx.throw(400, '只能上传1张头像');
      }

      const file = files[0];
      try {
        const fileStream = fs.createReadStream(file.filepath);
        const fileInfo = await saveFile(fileStream, {
          subPath: 'avatars',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024, // 5MB
        });

        finalAvatar = fileInfo.url;
        shouldDeleteOldAvatar = true;
      } catch (error) {
        this.ctx.throw(400, error.message);
      }
    } else if (data.avatar !== undefined) {
      // 情况2：传入的是字符串（保持原有头像或清空）
      finalAvatar = data.avatar;
      if (data.avatar !== oldAvatar && oldAvatar) {
        shouldDeleteOldAvatar = true;
      }
    }

    // 删除旧头像文件
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
    }

    // 解析 JSON 字符串字段
    if (typeof data.teachingTags === 'string') {
      try {
        data.teachingTags = JSON.parse(data.teachingTags);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }

    // 如果提供了密码，进行加密
    if (data.password) {
      const bcrypt = require('bcryptjs');
      data.password = await bcrypt.hash(data.password, 10);
    }

    // 构建更新数据（排除avatar字段，因为已经单独处理）
    const { avatar: _avatar, ...restUpdateData } = data;

    // 更新用户信息
    await user.update({
      ...restUpdateData,
      avatar: finalAvatar,
    });

    // 返回用户信息（排除密码）
    const { password: _, ...userInfo } = user.toJSON();
    return userInfo;
  }

  async delete(id) {
    const user = await this.ctx.model.User.findByPk(id);
    if (!user) {
      this.ctx.throw(404, 'User not found');
    }
    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  /**
   * 用户更新自己的个人信息（支持头像上传）
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @param {Array} files - 上传的文件数组
   * @return {Promise<Object>} 更新后的用户信息
   */
  async updateProfile(userId, updateData, files) {
    const user = await this.ctx.model.User.findByPk(userId);
    if (!user) {
      this.ctx.throw(404, '用户不存在');
    }

    const oldAvatar = user.avatar;

    // 如果更新邮箱，需要检查新邮箱是否已被其他用户使用
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.ctx.model.User.findOne({
        where: { email: updateData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        this.ctx.throw(409, '邮箱已被其他用户使用');
      }
    }

    // 处理头像上传逻辑
    let finalAvatar = oldAvatar;
    let shouldDeleteOldAvatar = false;

    // 情况1：上传了新文件
    if (files && files.length > 0) {
      if (files.length > 1) {
        this.ctx.throw(400, '只能上传1张头像');
      }

      const file = files[0];
      try {
        const fileStream = fs.createReadStream(file.filepath);
        const fileInfo = await saveFile(fileStream, {
          subPath: 'avatars',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024, // 5MB
        });

        finalAvatar = fileInfo.url;
        shouldDeleteOldAvatar = true;
      } catch (error) {
        this.ctx.throw(400, error.message);
      }
    } else if (updateData.avatar) {
      // 情况2：传入的是字符串（保持原有头像或清空）
      finalAvatar = updateData.avatar;
      if (updateData.avatar !== oldAvatar && oldAvatar) {
        shouldDeleteOldAvatar = true;
      }
    }

    // 删除旧头像文件
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
    }

    // 解析 JSON 字符串字段
    if (typeof updateData.teachingTags === 'string') {
      try {
        updateData.teachingTags = JSON.parse(updateData.teachingTags);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }

    // 更新用户信息（只更新允许的字段）
    const allowedFields = [
      'nickname',
      'email',
      'phone',
      'department',
      'teachingTags',
    ];

    const updateFields = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });

    // 设置头像
    updateFields.avatar = finalAvatar;

    await user.update(updateFields);

    // 返回用户信息（排除密码）
    const { password: _, ...userInfo } = user.toJSON();
    return userInfo;
  }

  /**
   * 管理员更新用户信息（支持头像上传）
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @param {Array} files - 上传的文件数组
   * @return {Promise<Object>} 更新结果
   */
  async updateByAdmin(userId, updateData, files) {
    const user = await this.ctx.model.User.findByPk(userId);
    if (!user) {
      this.ctx.throw(404, '用户不存在');
    }

    const oldAvatar = user.avatar;

    // 如果更新邮箱，需要检查新邮箱是否已被其他用户使用
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.ctx.model.User.findOne({
        where: { email: updateData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        this.ctx.throw(409, '邮箱已被其他用户使用');
      }
    }

    // 处理头像上传逻辑
    let finalAvatar = oldAvatar;
    let shouldDeleteOldAvatar = false;

    // 情况1：上传了新文件
    if (files && files.length > 0) {
      if (files.length > 1) {
        this.ctx.throw(400, '只能上传1张头像');
      }

      const file = files[0];
      try {
        const fileStream = fs.createReadStream(file.filepath);
        const fileInfo = await saveFile(fileStream, {
          subPath: 'avatars',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024, // 5MB
        });

        finalAvatar = fileInfo.url;
        shouldDeleteOldAvatar = true;
      } catch (error) {
        this.ctx.throw(400, error.message);
      }
    } else if (updateData.avatar) {
      // 情况2：传入的是字符串（保持原有头像或清空）
      finalAvatar = updateData.avatar;
      if (updateData.avatar !== oldAvatar && oldAvatar) {
        shouldDeleteOldAvatar = true;
      }
    }

    // 删除旧头像文件
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
    }

    // 解析 JSON 字符串字段
    if (typeof updateData.teachingTags === 'string') {
      try {
        updateData.teachingTags = JSON.parse(updateData.teachingTags);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }

    // 构建更新数据（排除avatar字段，因为已经单独处理）
    const { avatar: _avatar, ...restUpdateData } = updateData;

    // 更新用户信息
    await user.update({
      ...restUpdateData,
      avatar: finalAvatar,
    });

    return { message: '更新成功' };
  }

  /**
   * 创建用户（支持头像上传）
   * @param {Object} data - 用户数据
   * @param {Array} files - 上传的文件数组
   * @return {Promise<Object>} 创建的用户信息
   */
  async create(data, files) {
    const bcrypt = require('bcryptjs');

    // 检查用户名是否已存在
    if (data.username) {
      const existingUser = await this.ctx.model.User.findOne({
        where: { username: data.username },
      });
      if (existingUser) {
        this.ctx.throw(409, '用户名已存在');
      }
    }

    // 检查邮箱是否已存在
    if (data.email) {
      const existingEmail = await this.ctx.model.User.findOne({
        where: { email: data.email },
      });
      if (existingEmail) {
        this.ctx.throw(409, '邮箱已被使用');
      }
    }

    // 处理头像上传逻辑
    let avatar = null;
    if (files && files.length > 0) {
      if (files.length > 1) {
        this.ctx.throw(400, '只能上传1张头像');
      }

      const file = files[0];
      try {
        const fileStream = fs.createReadStream(file.filepath);
        const fileInfo = await saveFile(fileStream, {
          subPath: 'avatars',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024, // 5MB
        });

        avatar = fileInfo.url;
      } catch (error) {
        this.ctx.throw(400, error.message);
      }
    } else if (data.avatar) {
      avatar = data.avatar;
    }

    // 解析 JSON 字符串字段
    if (typeof data.teachingTags === 'string') {
      try {
        data.teachingTags = JSON.parse(data.teachingTags);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }

    // 如果提供了密码，进行加密
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // 创建用户数据
    const userData = {
      ...data,
      avatar,
    };

    const user = await this.ctx.model.User.create(userData);

    // 返回用户信息（排除密码）
    const { password: _, ...userInfo } = user.toJSON();
    return userInfo;
  }

  async checkExistence(username, email) {
    const result = {
      username: false,
      email: false,
    };

    if (username) {
      const userByUsername = await this.ctx.model.User.findOne({ where: { username } });
      result.username = !!userByUsername;
    }

    if (email) {
      const userByEmail = await this.ctx.model.User.findOne({ where: { email } });
      result.email = !!userByEmail;
    }

    return result;
  }

  async getProfile(userId) {
    const user = await this.ctx.model.User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      this.ctx.throw(404, '用户不存在');
    }

    return user;
  }

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {string} oldPassword - 原密码
   * @param {string} newPassword - 新密码
   * @param {string} confirmPassword - 确认新密码
   * @return {Promise<Object>} 修改结果
   */
  async changePassword(userId, oldPassword, newPassword, confirmPassword) {
    const bcrypt = require('bcryptjs');

    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      this.ctx.throw(400, '新密码和确认密码不一致');
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      this.ctx.throw(400, '新密码长度不能少于6位');
    }

    // 查询用户（需要包含密码字段）
    const user = await this.ctx.model.User.findByPk(userId);

    if (!user) {
      this.ctx.throw(404, '用户不存在');
    }

    // 验证原密码是否正确
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      this.ctx.throw(400, '原密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await user.update({ password: hashedPassword });

    return { message: '密码修改成功' };
  }
}

module.exports = UserService;
