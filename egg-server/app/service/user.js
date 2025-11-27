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

  async update(id, data) {
    const user = await this.ctx.model.User.findByPk(id);
    if (!user) {
      this.ctx.throw(404, 'User not found');
    }

    await user.update(data);
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
   * @param {Object} file - 上传的文件
   * @return {Promise<Object>} 更新后的用户信息
   */
  async updateProfile(userId, updateData, file) {
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

    // 处理头像更新逻辑
    let finalAvatar = oldAvatar;
    let shouldDeleteOldAvatar = false;

    if (file) {
      // 情况1：上传了新文件
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

        // 清理临时文件
        await fs.promises.unlink(file.filepath);
      } catch (error) {
        // 清理临时文件
        if (file.filepath) {
          await fs.promises.unlink(file.filepath).catch(() => {});
        }
        this.ctx.throw(400, error.message);
      }
    } else if (updateData.avatar) {
      // 情况2：传入的是字符串（保持原有头像）
      finalAvatar = updateData.avatar;
      shouldDeleteOldAvatar = false;
    }

    // 删除旧头像文件（仅在重新上传时）
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
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
   * @param {Object} file - 上传的文件
   * @return {Promise<Object>} 更新结果
   */
  async updateByAdmin(userId, updateData, file) {
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

    // 处理头像更新逻辑
    let finalAvatar = oldAvatar;
    let shouldDeleteOldAvatar = false;

    if (file) {
      // 情况1：上传了新文件
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

        // 清理临时文件
        await fs.promises.unlink(file.filepath);
      } catch (error) {
        // 清理临时文件
        if (file.filepath) {
          await fs.promises.unlink(file.filepath).catch(() => {});
        }
        this.ctx.throw(400, error.message);
      }
    } else if (updateData.avatar) {
      // 情况2：传入的是字符串（保持原有头像）
      finalAvatar = updateData.avatar;
      shouldDeleteOldAvatar = false;
    }

    // 删除旧头像文件（仅在重新上传时）
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
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

  async create(data) {
    return this.ctx.model.User.create(data);
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
}

module.exports = UserService;
