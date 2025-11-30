'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const { saveFile, generateFileUrl, deleteFile } = require('../utils/upload');

class LabService extends Service {
  async findAll(query = {}) {
    const { status, department } = query;
    const where = {};

    if (status) where.status = status;
    if (department) where.department = department;

    return this.ctx.model.Lab.findAll({
      where,
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instruments',
          attributes: ['id', 'name', 'model', 'status'],
        },
      ],
    });
  }

  async findById(id) {
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
    return lab;
  }

  async create(data) {
    return this.ctx.model.Lab.create(data);
  }

  /**
   * 创建实验室（支持文件上传）
   * @param {Object} formData - 表单数据
   * @param {Array} files - 上传的文件数组
   * @return {Object} 创建结果
   */
  async createWithFiles(formData, files) {
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

    // 解析 instrumentIds 字段
    let instrumentIds = [];
    if (formData.instrumentIds) {
      if (typeof formData.instrumentIds === 'string') {
        try {
          instrumentIds = JSON.parse(formData.instrumentIds);
        } catch (e) {
          instrumentIds = [];
        }
      } else if (Array.isArray(formData.instrumentIds)) {
        instrumentIds = formData.instrumentIds;
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

    return {
      message: '创建成功',
    };
  }

  async update(id, data) {
    const lab = await this.ctx.model.Lab.findByPk(id);
    if (!lab) {
      this.ctx.throw(404, 'Lab not found');
    }
    await lab.update(data);
    return lab;
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

    // 解析 instrumentIds 字段
    let instrumentIds = null;
    if (formData.instrumentIds !== undefined) {
      if (typeof formData.instrumentIds === 'string') {
        try {
          instrumentIds = JSON.parse(formData.instrumentIds);
        } catch (e) {
          instrumentIds = [];
        }
      } else if (Array.isArray(formData.instrumentIds)) {
        instrumentIds = formData.instrumentIds;
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

    return {
      message: '更新成功',
      data: lab,
    };
  }

  async getPopularLabs(query = {}) {
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

    return labs;
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
}

module.exports = LabService;
