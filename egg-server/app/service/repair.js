'use strict';

const Service = require('egg').Service;
const { generateFileUrl, deleteFile, saveFile, ALLOWED_IMAGE_TYPES } = require('../utils/upload');
const fs = require('fs');

class RepairService extends Service {
  async report(instrumentId, user, data, files) {
    const instrument = await this.ctx.model.Instrument.findByPk(instrumentId);

    if (!instrument) {
      this.ctx.throw(404, `仪器ID ${instrumentId} 不存在`);
    }

    // 处理图片上传
    const imageUrls = [];
    if (files && files.length > 0) {
      if (files.length > 5) {
        this.ctx.throw(400, '最多只能上传5张图片');
      }

      for (const file of files) {
        try {
          const fileStream = fs.createReadStream(file.filepath);
          const fileInfo = await saveFile(fileStream, {
            subPath: 'repairs',
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

    const repair = await this.ctx.model.Repair.create({
      instrumentId,
      reporterId: user.id,
      faultType: data.faultType,
      description: data.description,
      images: imageUrls,
      urgency: data.urgency,
      repairNumber: `R${Date.now()}${Math.floor(Math.random() * 1000)}`,
    });

    return { message: '报修成功', data: repair };
  }

  async getRepairs(query = {}) {
    const { keyword, status, page = 1, pageSize = 10 } = query;
    const where = {};
    const offset = (page - 1) * pageSize;

    if (status !== undefined && status !== null) {
      where.status = status;
    }

    const { count, rows } = await this.ctx.model.Repair.findAndCountAll({
      where,
      include: [
        { model: this.ctx.model.Instrument, as: 'instrument' },
        { model: this.ctx.model.User, as: 'reporter', attributes: ['id', 'username', 'nickname'] },
        { model: this.ctx.model.User, as: 'assignee', attributes: ['id', 'username', 'nickname'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    return { data: rows, total: count };
  }

  async updateRepairStatus(repairId, status, summary) {
    const repair = await this.ctx.model.Repair.findByPk(repairId, {
      include: [
        { model: this.ctx.model.Instrument, as: 'instrument' },
        { model: this.ctx.model.User, as: 'reporter' },
      ],
    });

    if (!repair) {
      this.ctx.throw(404, '报修记录不存在');
    }

    const updateData = { status };
    if (summary) {
      updateData.repairSummary = summary;
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    await repair.update(updateData);

    let notificationTitle = '';
    let notificationContent = '';

    switch (status) {
      case 'IN_PROGRESS':
        notificationTitle = '维修进度更新';
        notificationContent = `您的仪器维修已开始处理。\n仪器：${repair.instrument.name}\n维修单号：${repair.repairNumber}`;
        break;
      case 'COMPLETED':
        notificationTitle = '维修完成';
        notificationContent = `您的仪器维修已完成。\n仪器：${repair.instrument.name}\n维修单号：${repair.repairNumber}\n维修总结：${summary || '无'}`;
        break;
      default:
        notificationTitle = '维修状态更新';
        notificationContent = `您的仪器维修状态已更新为：${status}。\n仪器：${repair.instrument.name}`;
    }

    await this.ctx.service.notification.create({
      userId: repair.reporterId,
      type: 'REPAIR_PROGRESS',
      title: notificationTitle,
      content: notificationContent,
      relatedId: `repair-${repair.id}`,
    });

    return { message: '维修状态更新成功' };
  }

  async getMyRepairs(userId, query = {}) {
    const { keyword, status, page = 1, pageSize = 10 } = query;
    const whereCondition = { reporterId: userId };

    if (status) {
      whereCondition.status = status;
    }

    const { count, rows } = await this.ctx.model.Repair.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instrument',
          where: keyword ? {
            name: { [this.ctx.model.Op.like]: `%${keyword}%` },
          } : undefined,
        },
        { model: this.ctx.model.User, as: 'reporter', attributes: ['id', 'username', 'nickname'] },
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  async findAll() {
    return this.ctx.model.Repair.findAll({
      include: [
        { model: this.ctx.model.Instrument, as: 'instrument' },
        { model: this.ctx.model.User, as: 'reporter', attributes: ['id', 'username', 'nickname'] },
      ],
    });
  }

  async update(id, data) {
    const repair = await this.ctx.model.Repair.findByPk(id);
    if (!repair) {
      this.ctx.throw(404, 'Repair not found');
    }
    await repair.update(data);
    return repair;
  }
}

module.exports = RepairService;
