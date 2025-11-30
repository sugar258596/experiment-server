'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const { saveFile } = require('../utils/upload');

// 新闻状态常量
const NewsStatus = {
  PENDING: 0, // 待审核
  APPROVED: 1, // 已发布
  REJECTED: 2, // 已拒绝
};

class NewsService extends Service {
  async create(data, user) {
    const userId = user?.sub || user?.id;
    if (!user || !userId) {
      this.ctx.throw(400, '用户信息不完整,无法创建新闻');
    }

    return this.ctx.model.News.create({
      ...data,
      authorId: userId,
      status: NewsStatus.APPROVED,
    });
  }

  /**
   * 创建新闻（支持文件上传）
   * @param {Object} formData - 表单数据
   * @param {Array} files - 上传的文件数组
   * @param {Object} user - 当前用户
   * @return {Object} 创建结果
   */
  async createWithFiles(formData, files, user) {
    const userId = user?.sub || user?.id;
    if (!user || !userId) {
      this.ctx.throw(400, '用户信息不完整,无法创建新闻');
    }

    // 调试输出
    console.log('formData:', formData);
    console.log('files:', files);

    const { ALLOWED_IMAGE_TYPES } = require('../utils/upload');
    let coverImageUrl = null;
    const imageUrls = [];

    // 处理上传的文件
    if (files && files.length > 0) {
      // 文件按字段名分组
      const coverImageFiles = [];
      const newsImageFiles = [];

      for (const file of files) {
        if (file.fieldname === 'coverImage' || file.field === 'coverImage') {
          coverImageFiles.push(file);
        } else if (file.fieldname === 'images' || file.field === 'images') {
          newsImageFiles.push(file);
        }
      }

      // 处理封面图片（只取第一张）
      if (coverImageFiles.length > 0) {
        const file = coverImageFiles[0];
        const result = await saveFile(fs.createReadStream(file.filepath), {
          subPath: 'news',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024,
        });
        coverImageUrl = result.url;
      }

      // 处理新闻图片（最多10张）
      if (newsImageFiles.length > 0) {
        if (newsImageFiles.length > 10) {
          this.ctx.throw(400, '最多只能上传10张新闻图片');
        }

        for (const file of newsImageFiles) {
          const result = await saveFile(fs.createReadStream(file.filepath), {
            subPath: 'news',
            originalFilename: file.filename,
            mimeType: file.mimeType || file.mime,
            allowedTypes: ALLOWED_IMAGE_TYPES,
            maxSize: 5 * 1024 * 1024,
          });
          imageUrls.push(result.url);
        }
      }
    }

    // 创建新闻数据
    const newsData = {
      ...formData,
      coverImage: coverImageUrl,
      images: imageUrls,
      authorId: userId,
      status: NewsStatus.APPROVED,
    };

    // 解析 JSON 字符串字段
    if (typeof newsData.tags === 'string') {
      try {
        newsData.tags = JSON.parse(newsData.tags);
      } catch (e) {
        // 如果解析失败，保持原字符串
        newsData.tags = [];
      }
    }

    this.ctx.model.News.create(newsData);
    return {
      message: "添加成功"
    }
  }

  async findAll(query = {}) {
    const { keyword, tag, page = 1, pageSize = 10 } = query;
    const where = { status: NewsStatus.APPROVED };
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    if (keyword) {
      where[this.app.Sequelize.Op.or] = [
        { title: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { content: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    if (tag) {
      where.tags = { [this.app.Sequelize.Op.contains]: [tag] };
    }

    const { count, rows } = await this.ctx.model.News.findAndCountAll({
      where,
      include: [{ model: this.ctx.model.User, as: 'author', attributes: ['id', 'username', 'nickname'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count };
  }

  async findOne(id) {
    const news = await this.ctx.model.News.findByPk(id, {
      include: [{ model: this.ctx.model.User, as: 'author', attributes: ['id', 'username', 'nickname'] }],
    });

    if (!news) {
      this.ctx.throw(404, `动态ID ${id} 不存在`);
    }

    return news;
  }

  async like(id) {
    const news = await this.findOne(id);
    await news.increment('likes', { by: 1 });
    return news.reload();
  }

  async review(id, approved, currentUser) {
    if (currentUser && !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      this.ctx.throw(403, '需要管理员权限才能审核新闻');
    }

    const news = await this.findOne(id);
    const updateData = {
      status: approved ? NewsStatus.APPROVED : NewsStatus.REJECTED,
    };

    if (currentUser) {
      const userId = currentUser.sub || currentUser.id;
      updateData.reviewerId = userId;
      updateData.reviewTime = new Date();
    }

    await news.update(updateData);
    return news;
  }

  /**
   * 更新新闻（支持文件上传）
   * @param {Number} id - 新闻ID
   * @param {Object} formData - 表单数据
   * @param {Array} files - 上传的文件数组
   * @param {Object} user - 当前用户
   * @return {Object} 更新结果
   */
  async updateWithFiles(id, formData, files, user) {
    const userId = user?.sub || user?.id;
    if (!user || !userId) {
      this.ctx.throw(400, '用户信息不完整,无法更新新闻');
    }

    // 查找新闻
    const news = await this.ctx.model.News.findByPk(id);
    if (!news) {
      this.ctx.throw(404, `新闻ID ${id} 不存在`);
    }

    // 权限检查：只有作者或管理员可以修改
    const isAuthor = news.authorId === userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isAuthor && !isAdmin) {
      this.ctx.throw(403, '只有作者或管理员可以修改新闻');
    }

    const { ALLOWED_IMAGE_TYPES } = require('../utils/upload');
    let coverImageUrl = news.coverImage; // 保留原封面图片
    const imageUrls = news.images ? [...news.images] : []; // 保留原新闻图片

    // 处理上传的文件
    if (files && files.length > 0) {
      // 文件按字段名分组
      const coverImageFiles = [];
      const newsImageFiles = [];

      for (const file of files) {
        if (file.fieldname === 'coverImage' || file.field === 'coverImage') {
          coverImageFiles.push(file);
        } else if (file.fieldname === 'images' || file.field === 'images') {
          newsImageFiles.push(file);
        }
      }

      // 处理封面图片（只取第一张，替换原封面）
      if (coverImageFiles.length > 0) {
        const file = coverImageFiles[0];
        const result = await saveFile(fs.createReadStream(file.filepath), {
          subPath: 'news',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024,
        });
        coverImageUrl = result.url;
      }

      // 处理新闻图片（追加到现有图片）
      if (newsImageFiles.length > 0) {
        const totalImages = imageUrls.length + newsImageFiles.length;
        if (totalImages > 10) {
          this.ctx.throw(400, '新闻图片总数不能超过10张');
        }

        for (const file of newsImageFiles) {
          const result = await saveFile(fs.createReadStream(file.filepath), {
            subPath: 'news',
            originalFilename: file.filename,
            mimeType: file.mimeType || file.mime,
            allowedTypes: ALLOWED_IMAGE_TYPES,
            maxSize: 5 * 1024 * 1024,
          });
          imageUrls.push(result.url);
        }
      }
    }

    // 创建更新数据
    const updateData = {
      ...formData,
      coverImage: coverImageUrl,
      images: imageUrls,
    };

    // 解析 JSON 字符串字段
    if (typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (e) {
        // 如果解析失败，保持原值
        delete updateData.tags;
      }
    }

    // 更新新闻
    await news.update(updateData);
    return {
      message: "更新成功"
    }
  }

  /**
   * 删除新闻（软删除）
   * @param {Number} id - 新闻ID
   * @param {Object} user - 当前用户
   * @return {Object} 删除结果
   */
  async remove(id, user) {
    const userId = user?.sub || user?.id;
    if (!user || !userId) {
      this.ctx.throw(400, '用户信息不完整,无法删除新闻');
    }

    // 查找新闻
    const news = await this.ctx.model.News.findByPk(id);
    if (!news) {
      this.ctx.throw(404, `新闻ID ${id} 不存在`);
    }

    // 权限检查：只有作者或管理员可以删除
    const isAuthor = news.authorId === userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isAuthor && !isAdmin) {
      this.ctx.throw(403, '只有作者或管理员可以删除新闻');
    }

    // 执行软删除
    await news.destroy();
    return { message: '删除成功' };
  }

}

module.exports = NewsService;
