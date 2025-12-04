'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const { saveFile, generateFileUrl, deleteFile } = require('../utils/upload');

class LabService extends Service {
  /**
   * 为实验室数据附加当前用户的收藏状态
   * @param {Array|Object} labs - 实验室数据（单个或数组）
   * @param {number} userId - 用户ID
   * @return {Array|Object} 包含收藏状态的实验室数据
   */
  async attachFavoriteStatus(labs, userId) {
    // 如果没有实验室数据，直接返回
    if (!labs) {
      return labs;
    }

    // 判断是单个对象还是数组
    const isArray = Array.isArray(labs);
    const labArray = isArray ? labs : [labs];

    // 如果没有实验室或用户ID为空，设置所有isFavorite为false
    if (labArray.length === 0 || !userId) {
      labArray.forEach(lab => {
        lab.dataValues.isFavorite = false;
        lab.isFavorite = false;
      });
      return isArray ? labArray : labArray[0];
    }

    // 获取所有实验室ID
    const labIds = labArray.map(lab => lab.id);

    // 单次查询获取用户的所有收藏记录
    const favorites = await this.ctx.model.Favorite.findAll({
      where: {
        userId,
        labId: labIds,
      },
      attributes: ['labId'],
    });

    // 创建收藏的实验室ID集合，便于快速查找
    const favoritedLabIds = new Set(favorites.map(fav => fav.labId));

    // 为每个实验室添加isFavorite字段
    labArray.forEach(lab => {
      const isFavorite = favoritedLabIds.has(lab.id);
      // Set on dataValues for JSON serialization
      lab.dataValues.isFavorite = isFavorite;
      // Also set directly on the instance
      lab.isFavorite = isFavorite;
    });

    // 返回原始格式（单个对象或数组）
    return isArray ? labArray : labArray[0];
  }

  async findAll(query = {}, userId = null) {
    const { status, department, keyword, page = 1, pageSize = 10, tags } = query;
    const where = {};
    const Op = this.app.Sequelize.Op;

    if (status) where.status = status;
    if (department) where.department = department;

    // 关键字搜索：匹配名称、位置、描述
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { location: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { department: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // 标签筛选
    if (tags) {
      where.tags = { [Op.like]: `%${tags}%` };
    }

    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows: labs } = await this.ctx.model.Lab.findAndCountAll({
      where,
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // 附加收藏状态
    const labsWithFavorite = await this.attachFavoriteStatus(labs, userId);

    // Convert to plain objects to ensure isFavorite is included in JSON serialization
    const list = labsWithFavorite.map(lab => {
      const plainLab = lab.toJSON();
      plainLab.isFavorite = lab.isFavorite;
      return plainLab;
    });

    return {
      list,
      total: count,
      page: parseInt(page),
      pageSize: limit,
    };
  }

  async findById(id, userId = null) {
    const lab = await this.ctx.model.Lab.findByPk(id, {
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status', 'description', 'specifications', 'images'],
        },
        {
          model: this.ctx.model.Appointment,
          as: 'appointments',
        },
        {
          model: this.ctx.model.Favorite,
          as: 'favorites',
        },
        {
          model: this.ctx.model.Evaluation,
          as: 'evaluations',
        },
      ],
    });
    if (!lab) {
      this.ctx.throw(404, 'Lab not found');
    }

    // 附加收藏状态
    const labWithFavorite = await this.attachFavoriteStatus(lab, userId);

    // Convert to plain object to ensure isFavorite is included in JSON serialization
    const plainLab = labWithFavorite.toJSON();
    plainLab.isFavorite = labWithFavorite.isFavorite;
    return plainLab;
  }

  async create(data) {
    const lab = await this.ctx.model.Lab.create(data);

    // 重新查询以包含关联的仪器信息
    const labWithInstruments = await this.ctx.model.Lab.findByPk(lab.id, {
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status', 'description', 'specifications', 'images'],
        },
      ],
    });

    return labWithInstruments;
  }

  /**
   * 创建实验室（支持文件上传）
   * @param {Object} formData - 表单数据
   * @param {Array} files - 上传的文件数组
   * @param {number} creatorId - 创建者ID
   * @return {Object} 创建结果
   */
  async createWithFiles(formData, files, creatorId) {
    console.log(formData);
    const { ALLOWED_IMAGE_TYPES } = require('../utils/upload');
    const imageUrls = [];

    // 处理上传的图片文件
    if (files && files.length > 0) {
      if (files.length > 10) {
        this.ctx.throw(400, '最多只能上传10张图片');
      }


      for (const file of files) {
        const result = await saveFile(fs.createReadStream(file.filepath), {
          subPath: 'labs',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024,
        });
        imageUrls.push(result.url);
      }
    }

    // 创建实验室数据
    const labData = {
      ...formData,
      images: imageUrls,
      creatorId,
    };

    // 解析 JSON 字符串字段
    if (typeof labData.equipmentList === 'string') {
      try {
        labData.equipmentList = JSON.parse(labData.equipmentList);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }
    if (typeof labData.tags === 'string') {
      try {
        labData.tags = JSON.parse(labData.tags);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }

    // 确保 tags 字段不为空，如果没有提供则设置为空数组
    if (!labData.tags) {
      labData.tags = [];
    }

    // 解析 instrumentIds 字段
    let instrumentIds = [];
    if (formData.instrumentIds) {
      if (typeof formData.instrumentIds === 'string') {
        try {
          const parsed = JSON.parse(formData.instrumentIds);
          // 兼容单个ID和数组两种情况
          instrumentIds = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // 如果不是有效JSON，尝试按逗号分隔或作为单个ID处理
          instrumentIds = formData.instrumentIds.includes(',')
            ? formData.instrumentIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
            : [parseInt(formData.instrumentIds, 10)].filter(id => !isNaN(id));
        }
      } else if (Array.isArray(formData.instrumentIds)) {
        instrumentIds = formData.instrumentIds;
      } else if (typeof formData.instrumentIds === 'number') {
        instrumentIds = [formData.instrumentIds];
      }
    }

    // 创建实验室
    const lab = await this.ctx.model.Lab.create(labData);

    // 如果提供了仪器ID数组，则关联仪器
    if (instrumentIds && instrumentIds.length > 0) {
      await this.ctx.model.Instrument.update(
        { labId: lab.id },
        {
          where: {
            id: instrumentIds,
          },
        }
      );
    }

    // 重新查询以包含关联的仪器信息
    const labWithInstruments = await this.ctx.model.Lab.findByPk(lab.id, {
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status', 'description', 'specifications', 'images'],
        },
      ],
    });

    return {
      message: '创建成功',
      data: labWithInstruments,
    };
  }

  async update(id, data) {
    const lab = await this.ctx.model.Lab.findByPk(id);
    if (!lab) {
      this.ctx.throw(404, 'Lab not found');
    }
    await lab.update(data);

    // 重新查询以包含最新的仪器关联信息
    const updatedLab = await this.ctx.model.Lab.findByPk(id, {
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status', 'description', 'specifications', 'images'],
        },
      ],
    });

    return updatedLab;
  }

  async delete(id) {
    const lab = await this.ctx.model.Lab.findByPk(id);
    if (!lab) {
      this.ctx.throw(404, 'Lab not found');
    }

    // 删除关联的图片文件
    if (lab.images && Array.isArray(lab.images)) {
      lab.images.forEach(imageUrl => deleteFile(imageUrl));
    }

    await lab.destroy();
    return { message: 'Lab deleted successfully' };
  }

  /**
   * 更新实验室（支持文件上传 - 自动检测模式）
   * @param {number} id - 实验室ID
   * @param {Object} formData - 更新表单数据
   * @param {Array} files - 上传的新图片文件
   *
   * 自动检测模式说明：
   * 1. 仅上传文件 - 替换模式：删除所有旧图片，只使用新上传的图片
   * 2. 上传文件 + 传入images - 混合模式：保留images中指定的旧图片，并追加新上传的图片
   * 3. 仅传入images - 保持/调整模式：使用images中指定的图片URL
   * 4. 都不传 - 保持原样：保持数据库中原有的图片
   */
  async updateWithFiles(id, formData, files) {
    console.log(formData);

    const { ALLOWED_IMAGE_TYPES } = require('../utils/upload');

    const lab = await this.ctx.model.Lab.findByPk(id);
    if (!lab) {
      this.ctx.throw(404, 'Lab not found');
    }

    let finalImages = [];
    const currentImages = lab.images || [];
    const hasUploadedFiles = files && files.length > 0;
    const hasFormImages = formData.images;

    if (hasUploadedFiles && files.length > 10) {
      this.ctx.throw(400, '最多只能上传10张图片');
    }

    if (hasUploadedFiles && !hasFormImages) {
      // 模式1: 仅上传文件 - 替换模式
      currentImages.forEach(imageUrl => deleteFile(imageUrl));

      for (const file of files) {
        const result = await saveFile(fs.createReadStream(file.filepath), {
          subPath: 'labs',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024,
        });
        finalImages.push(result.url);
      }
    } else if (hasUploadedFiles && hasFormImages) {
      // 模式2: 混合模式 - 保留指定旧图片 + 追加新图片
      let formImagesArray;
      if (typeof formData.images === 'string') {
        try {
          formImagesArray = formData.images ? JSON.parse(formData.images) : [];
        } catch (e) {
          formImagesArray = [];
        }
      } else {
        formImagesArray = formData.images;
      }

      const keptImages = Array.isArray(formImagesArray) ? formImagesArray : [formImagesArray];

      // 删除不保留的旧图片
      currentImages.forEach(imageUrl => {
        if (!keptImages.includes(imageUrl)) {
          deleteFile(imageUrl);
        }
      });

      finalImages = [...keptImages];

      // 追加新上传的图片
      for (const file of files) {
        const result = await saveFile(fs.createReadStream(file.filepath), {
          subPath: 'labs',
          originalFilename: file.filename,
          mimeType: file.mimeType || file.mime,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          maxSize: 5 * 1024 * 1024,
        });
        finalImages.push(result.url);
      }
    } else if (!hasUploadedFiles && hasFormImages) {
      // 模式3: 仅传入images - 保持/调整模式
      let formImagesArray;
      if (typeof formData.images === 'string') {
        try {
          formImagesArray = formData.images ? JSON.parse(formData.images) : [];
        } catch (e) {
          formImagesArray = [];
        }
      } else {
        formImagesArray = formData.images;
      }

      finalImages = Array.isArray(formImagesArray) ? formImagesArray : [formImagesArray];

      // 删除不保留的旧图片
      currentImages.forEach(imageUrl => {
        if (!finalImages.includes(imageUrl)) {
          deleteFile(imageUrl);
        }
      });
    } else {
      // 模式4: 都不传 - 保持原样
      finalImages = currentImages;
    }

    // 更新实验室数据
    const updateData = {
      ...formData,
      images: finalImages,
    };

    // 解析 JSON 字符串字段
    if (typeof updateData.equipmentList === 'string') {
      try {
        updateData.equipmentList = JSON.parse(updateData.equipmentList);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }
    if (typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch (e) {
        // 如果解析失败，保持原字符串
      }
    }

    // 确保 tags 字段不为空，如果没有提供则设置为空数组
    if (!updateData.tags) {
      updateData.tags = [];
    }

    // 解析 instrumentIds 字段
    let instrumentIds = null;
    if (formData.instrumentIds !== undefined) {
      if (typeof formData.instrumentIds === 'string') {
        try {
          const parsed = JSON.parse(formData.instrumentIds);
          // 兼容单个ID和数组两种情况
          instrumentIds = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // 如果不是有效JSON，尝试按逗号分隔或作为单个ID处理
          instrumentIds = formData.instrumentIds.includes(',')
            ? formData.instrumentIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
            : [parseInt(formData.instrumentIds, 10)].filter(id => !isNaN(id));
        }
      } else if (Array.isArray(formData.instrumentIds)) {
        instrumentIds = formData.instrumentIds;
      } else if (typeof formData.instrumentIds === 'number') {
        instrumentIds = [formData.instrumentIds];
      } else {
        instrumentIds = [];
      }
    }

    await lab.update(updateData);

    // 如果提供了 instrumentIds 字段，则更新仪器关联
    if (instrumentIds !== null) {
      // 先解除该实验室下所有现有仪器的关联
      await this.ctx.model.Instrument.update(
        { labId: null },
        {
          where: {
            labId: id,
          },
        }
      );

      // 如果提供了新的仪器ID列表，则关联这些仪器
      if (instrumentIds.length > 0) {
        await this.ctx.model.Instrument.update(
          { labId: id },
          {
            where: {
              id: instrumentIds,
            },
          }
        );
      }
    }

    // 重新查询以包含最新的仪器关联信息
    const updatedLab = await this.ctx.model.Lab.findByPk(id, {
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status', 'description', 'specifications', 'images'],
        },
      ],
    });

    return {
      message: '更新成功',
      data: updatedLab,
    };
  }

  async getPopularLabs(query = {}, userId = null) {
    const { page = 1, pageSize = 10 } = query;

    const labs = await this.ctx.model.Lab.findAll({
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: this.ctx.model.Favorite,
          as: 'favorites',
          attributes: [],
        },
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status'],
        },
      ],
    });

    // 附加收藏状态
    const labsWithFavorite = await this.attachFavoriteStatus(labs, userId);

    // Convert to plain objects to ensure isFavorite is included in JSON serialization
    return labsWithFavorite.map(lab => {
      const plainLab = lab.toJSON();
      plainLab.isFavorite = lab.isFavorite;
      return plainLab;
    });
  }

  async getOptions(query = {}) {
    const { keyword, page = 1, pageSize = 10 } = query;
    const whereCondition = {};

    if (keyword) {
      whereCondition[this.app.Sequelize.Op.or] = [
        { name: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { location: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { department: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows } = await this.ctx.model.Lab.findAndCountAll({
      where: whereCondition,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return {
      data: rows,
      total: count,
    };
  }

  /**
   * 获取指定创建者的实验室列表
   * @param {number} creatorId - 创建者ID
   * @param {Object} query - 查询参数
   * @return {Object} 实验室列表
   */
  async findByCreator(creatorId, query = {}) {
    const { page = 1, pageSize = 10, keyword } = query;
    const where = { creatorId };
    const Op = this.app.Sequelize.Op;

    if (keyword) {
      where[Op.and] = [
        { creatorId },
        {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { location: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
          ],
        },
      ];
      delete where.creatorId;
    }

    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows: labs } = await this.ctx.model.Lab.findAndCountAll({
      where,
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      list: labs,
      total: count,
      page: parseInt(page),
      pageSize: limit,
    };
  }

  /**
   * 检查用户是否是实验室的创建者
   * @param {number} labId - 实验室ID
   * @param {number} userId - 用户ID
   * @return {boolean} 是否是创建者
   */
  async isLabCreator(labId, userId) {
    const lab = await this.ctx.model.Lab.findByPk(labId);
    return lab && lab.creatorId === userId;
  }

  /**
   * 获取用户创建的所有实验室ID
   * @param {number} creatorId - 创建者ID
   * @return {Array} 实验室ID数组
   */
  async getCreatorLabIds(creatorId) {
    const labs = await this.ctx.model.Lab.findAll({
      where: { creatorId },
      attributes: ['id'],
    });
    return labs.map(lab => lab.id);
  }
}

module.exports = LabService;
