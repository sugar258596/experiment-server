'use strict';

const Service = require('egg').Service;
const { deleteFile, saveFile, ALLOWED_IMAGE_TYPES } = require('../utils/upload');
const fs = require('fs');

class InstrumentService extends Service {
  async create(data) {
    if (data.labId) {
      const lab = await this.ctx.model.Lab.findByPk(data.labId);
      if (!lab) {
        this.ctx.throw(404, '所属实验室不存在');
      }
    }

    const instrument = await this.ctx.model.Instrument.create(data);

    // 重新查询以包含实验室信息
    const instrumentWithLab = await this.ctx.model.Instrument.findByPk(instrument.id, {
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });

    return instrumentWithLab;
  }

  /**
   * 创建仪器(支持文件上传)
   * @param {Object} data - 仪器数据
   * @param {Array} files - 上传的文件数组
   * @return {Promise<Object>} 创建结果
   */
  async createWithFiles(data, files) {
    // 验证实验室存在
    if (data.labId) {
      const lab = await this.ctx.model.Lab.findByPk(data.labId);
      if (!lab) {
        this.ctx.throw(404, '所属实验室不存在');
      }
    }

    // 生成图片URL数组
    const imageUrls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileStream = fs.createReadStream(file.filepath);
          const fileInfo = await saveFile(fileStream, {
            subPath: 'instruments',
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
            await fs.promises.unlink(file.filepath).catch(() => { });
          }
          this.ctx.throw(400, error.message);
        }
      }
    }

    // 创建仪器
    const instrument = await this.ctx.model.Instrument.create({
      ...data,
      images: imageUrls,
    });

    // 重新查询以包含实验室信息
    const instrumentWithLab = await this.ctx.model.Instrument.findByPk(instrument.id, {
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });

    return { message: '创建成功', data: instrumentWithLab };
  }

  /**
   * 更新仪器信息(支持文件上传)
   * @param {number} id - 仪器ID
   * @param {Object} updateData - 更新数据
   * @param {Array} files - 上传的新图片文件
   * @return {Promise<Object>} 更新结果
   */
  async updateWithFiles(id, updateData, files) {
    // 查询现有仪器
    const instrument = await this.findOne(id);
    const oldImages = instrument.images || [];

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
            subPath: 'instruments',
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
            await fs.promises.unlink(file.filepath).catch(() => { });
          }
          this.ctx.throw(400, error.message);
        }
      }

      finalImages = newImageUrls;
      shouldDeleteOldImages = true; // 需要删除所有旧图片
    } else if (updateData.images && typeof updateData.images === 'string') {
      // 情况2：传入的是字符串（JSON格式的URL数组）
      try {
        const parsed = JSON.parse(updateData.images);
        if (Array.isArray(parsed)) {
          finalImages = parsed;
          shouldDeleteOldImages = false; // 不删除旧图片，保持原有的
        } else {
          // 格式不正确，保持原有图片
          finalImages = oldImages;
        }
      } catch {
        // JSON解析失败，保持原有图片
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

    // 处理实验室关联
    if (updateData.labId) {
      const lab = await this.ctx.model.Lab.findByPk(updateData.labId);
      if (!lab) {
        this.ctx.throw(404, '所属实验室不存在');
      }
    }

    // 构建更新数据
    const { images: _images, ...restUpdateData } = updateData;

    // 更新仪器
    await instrument.update({
      ...restUpdateData,
      images: finalImages,
    });

    // 重新查询以包含实验室信息
    const updatedInstrument = await this.ctx.model.Instrument.findByPk(id, {
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });

    return { message: '更新成功', data: updatedInstrument };
  }

  async findAll(query = {}) {
    const { keyword, labId, status, page = 1, pageSize = 10 } = query;
    const where = {};
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    if (keyword) {
      where[this.app.Sequelize.Op.or] = [
        { name: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { model: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    if (labId) {
      where.labId = labId;
    }

    if (status !== undefined && status !== null) {
      where.status = status;
    }

    const { count, rows } = await this.ctx.model.Instrument.findAndCountAll({
      where,
      include: [{ model: this.ctx.model.Lab, as: 'lab', attributes: ['id', 'name', 'department'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { list: rows, total: count };
  }

  async findOne(id) {
    const instrument = await this.ctx.model.Instrument.findByPk(id, {
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });

    if (!instrument) {
      this.ctx.throw(404, `仪器ID ${id} 不存在`);
    }

    return instrument;
  }

  async update(id, data) {
    const instrument = await this.findOne(id);

    if (data.labId) {
      const lab = await this.ctx.model.Lab.findByPk(data.labId);
      if (!lab) {
        this.ctx.throw(404, '所属实验室不存在');
      }
    }

    await instrument.update(data);

    // 重新查询以包含最新的实验室信息
    const updatedInstrument = await this.ctx.model.Instrument.findByPk(id, {
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });

    return updatedInstrument;
  }

  async remove(id) {
    const instrument = await this.findOne(id);
    await instrument.destroy();
  }

  async apply(instrumentId, user, data) {
    const instrument = await this.findOne(instrumentId);

    // 仪器状态：0-正常,1-停用,2-维护中,3-故障,4-借出
    // 只有正常状态(0)才可以申请
    if (instrument.status !== 0) {
      this.ctx.throw(400, '该仪器当前状态不可申请使用');
    }

    const existingApplication = await this.ctx.model.InstrumentApplication.findOne({
      where: {
        applicantId: user.sub,
        instrumentId,
        status: { [this.app.Sequelize.Op.in]: [0, 1] },
      },
    });

    if (existingApplication) {
      this.ctx.throw(400, '您已对该仪器提交过申请，不能重复申请');
    }

    if (new Date(data.startTime) >= new Date(data.endTime)) {
      this.ctx.throw(400, '结束时间必须大于开始时间');
    }

    await this.ctx.model.InstrumentApplication.create({
      instrumentId,
      applicantId: user.sub,
      purpose: data.purpose,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    return { message: '申请成功' };
  }

  async reviewApplication(applicationId, reviewer, reviewData) {
    const application = await this.ctx.model.InstrumentApplication.findByPk(applicationId, {
      include: [{ model: this.ctx.model.Instrument, as: 'instrument' }],
    });

    if (!application) {
      this.ctx.throw(404, '申请记录不存在');
    }

    // status: 0-待审核, 1-已通过, 2-已拒绝
    const statusMap = { 'APPROVED': 1, 'REJECTED': 2 };
    const statusCode = statusMap[reviewData.status];

    if (statusCode === undefined) {
      this.ctx.throw(400, '审核状态只能是已通过或已拒绝');
    }

    await application.update({
      status: statusCode,
      reviewerId: reviewer.sub,
      reviewTime: new Date(),
      rejectionReason: reviewData.reason,
    });

    if (statusCode === 1) {
      // status: 0-正常, 1-停用, 2-维护中, 3-故障, 4-借出
      await this.ctx.model.Instrument.update(
        { status: 4 },
        { where: { id: application.instrumentId } }
      );
    }

    return { message: '审核成功' };
  }

  async getApplications(query = {}) {
    const { keyword, page = 1, pageSize = 10, instrumentId, applicantId, status } = query;
    const where = {};
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    if (instrumentId) {
      where.instrumentId = instrumentId;
    }

    if (applicantId) {
      where.applicantId = applicantId;
    }

    if (status !== undefined) {
      where.status = status;
    }

    const { count, rows } = await this.ctx.model.InstrumentApplication.findAndCountAll({
      where,
      include: [
        { model: this.ctx.model.Instrument, as: 'instrument', include: [{ model: this.ctx.model.Lab, as: 'lab' }] },
        { model: this.ctx.model.User, as: 'applicant', attributes: ['id', 'username', 'role'] },
        { model: this.ctx.model.User, as: 'reviewer', attributes: ['id', 'username', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page: parseInt(page), pageSize: limit };
  }

  async getMyApplications(userId, query = {}) {
    const { keyword, page = 1, pageSize = 10, status } = query;
    const where = { applicantId: userId };
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    if (status !== undefined) {
      where.status = status;
    }

    const { count, rows } = await this.ctx.model.InstrumentApplication.findAndCountAll({
      where,
      include: [
        { model: this.ctx.model.Instrument, as: 'instrument', include: [{ model: this.ctx.model.Lab, as: 'lab' }] },
        { model: this.ctx.model.User, as: 'applicant', attributes: ['id', 'username', 'role'] },
        { model: this.ctx.model.User, as: 'reviewer', attributes: ['id', 'username', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page: parseInt(page), pageSize: limit };
  }

  /**
   * 获取仪器下拉选择列表
   * @param {Object} query - 查询参数
   * @return {Promise<Object>} 仪器列表和总数
   */
  async getInstrumentSelect(query = {}) {
    const { keyword, page = 1, pageSize = 10 } = query;
    const whereCondition = {};

    if (keyword) {
      whereCondition[this.app.Sequelize.Op.or] = [
        { name: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { model: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const { count, rows } = await this.ctx.model.Instrument.findAndCountAll({
      where: whereCondition,
      attributes: ['id', 'name', 'model', 'status'],
      include: [{ model: this.ctx.model.Lab, as: 'lab', attributes: ['id', 'name', 'department', 'location'] }],
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return {
      success: true,
      data: rows,
      total: count,
    };
  }
}

module.exports = InstrumentService;
