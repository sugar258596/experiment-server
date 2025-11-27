'use strict';

const Service = require('egg').Service;
const { generateFileUrl, deleteFile, saveFile, ALLOWED_IMAGE_TYPES } = require('../utils/upload');
const fs = require('fs');

class BannerService extends Service {
  async createType(data) {
    return this.ctx.model.BannerType.create(data);
  }

  async findAllTypes() {
    const types = await this.ctx.model.BannerType.findAll({
      order: [['createdAt', 'DESC']],
    });
    return { data: types, total: types.length };
  }

  async findOneType(id) {
    const bannerType = await this.ctx.model.BannerType.findByPk(id, {
      include: [{ model: this.ctx.model.Banner, as: 'banners' }],
    });

    if (!bannerType) {
      this.ctx.throw(404, `轮播图类型ID ${id} 不存在`);
    }

    return bannerType;
  }

  async updateType(id, data) {
    const bannerType = await this.ctx.model.BannerType.findByPk(id);

    if (!bannerType) {
      this.ctx.throw(404, `轮播图类型ID ${id} 不存在`);
    }

    await bannerType.update(data);
    return { message: '轮播图类型更新成功' };
  }

  async removeType(id) {
    const bannerType = await this.ctx.model.BannerType.findByPk(id);

    if (!bannerType) {
      this.ctx.throw(404, `轮播图类型ID ${id} 不存在`);
    }

    await bannerType.destroy();
    return { message: '轮播图类型删除成功' };
  }

  async createBanner(data, files) {
    const bannerType = await this.ctx.model.BannerType.findByPk(data.typeId);

    if (!bannerType) {
      this.ctx.throw(404, `轮播图类型ID ${data.typeId} 不存在`);
    }

    // 生成图片URL数组
    const imageUrls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileStream = fs.createReadStream(file.filepath);
          const fileInfo = await saveFile(fileStream, {
            subPath: 'banners',
            originalFilename: file.filename,
            mimeType: file.mimeType || file.mime,
            allowedTypes: ALLOWED_IMAGE_TYPES,
            maxSize: 5 * 1024 * 1024, // 5MB
          });

          imageUrls.push(fileInfo.url);

          // 清理临时文件
          await fs.promises.unlink(file.filepath);
        } catch (error) {
          // 清理临时文件
          if (file.filepath) {
            await fs.promises.unlink(file.filepath).catch(() => {});
          }
          this.ctx.throw(400, error.message);
        }
      }
    }

    await this.ctx.model.Banner.create({
      ...data,
      images: imageUrls,
    });

    return { message: '轮播图创建成功' };
  }

  async findAllBanners(typeId) {
    const where = {};
    if (typeId) {
      where.typeId = typeId;
    }

    const banners = await this.ctx.model.Banner.findAll({
      where,
      include: [{ model: this.ctx.model.BannerType, as: 'type' }],
      order: [['createdAt', 'DESC']],
    });

    return { data: banners, total: banners.length };
  }

  async findOneBanner(id) {
    const banner = await this.ctx.model.Banner.findByPk(id, {
      include: [{ model: this.ctx.model.BannerType, as: 'type' }],
    });

    if (!banner) {
      this.ctx.throw(404, `轮播图ID ${id} 不存在`);
    }

    return banner;
  }

  async updateBanner(id, data, files) {
    const banner = await this.ctx.model.Banner.findByPk(id);

    if (!banner) {
      this.ctx.throw(404, `轮播图ID ${id} 不存在`);
    }

    if (data.typeId && data.typeId !== banner.typeId) {
      const bannerType = await this.ctx.model.BannerType.findByPk(data.typeId);
      if (!bannerType) {
        this.ctx.throw(404, `轮播图类型ID ${data.typeId} 不存在`);
      }
    }

    const oldImages = banner.images || [];

    // 处理图片更新逻辑
    let finalImages = [];
    let shouldDeleteOldImages = false;

    if (files && files.length > 0) {
      // 情况1：上传了新文件
      const newImageUrls = [];

      for (const file of files) {
        try {
          const fileStream = fs.createReadStream(file.filepath);
          const fileInfo = await saveFile(fileStream, {
            subPath: 'banners',
            originalFilename: file.filename,
            mimeType: file.mimeType || file.mime,
            allowedTypes: ALLOWED_IMAGE_TYPES,
            maxSize: 5 * 1024 * 1024, // 5MB
          });

          newImageUrls.push(fileInfo.url);

          // 清理临时文件
          await fs.promises.unlink(file.filepath);
        } catch (error) {
          // 清理临时文件
          if (file.filepath) {
            await fs.promises.unlink(file.filepath).catch(() => {});
          }
          this.ctx.throw(400, error.message);
        }
      }

      finalImages = newImageUrls;
      shouldDeleteOldImages = true;
    } else if (data.images && typeof data.images === 'string') {
      // 情况2：传入的是字符串（JSON格式的URL数组）
      try {
        const parsed = JSON.parse(data.images);
        if (Array.isArray(parsed)) {
          finalImages = parsed;
          shouldDeleteOldImages = false;
        } else {
          finalImages = oldImages;
        }
      } catch {
        finalImages = oldImages;
      }
    } else {
      // 情况3：未提供images字段，保持原有图片
      finalImages = oldImages;
    }

    // 删除旧图片文件（仅在重新上传时）
    if (shouldDeleteOldImages && oldImages.length > 0) {
      oldImages.forEach(imageUrl => {
        deleteFile(imageUrl);
      });
    }

    // 构建更新数据
    const { images: _images, ...restUpdateData } = data;

    await banner.update({
      ...restUpdateData,
      images: finalImages,
    });

    return { message: '轮播图更新成功' };
  }

  async removeBanner(id) {
    const banner = await this.ctx.model.Banner.findByPk(id);

    if (!banner) {
      this.ctx.throw(404, `轮播图ID ${id} 不存在`);
    }

    await banner.destroy();
    return { message: '轮播图删除成功' };
  }
}

module.exports = BannerService;
