'use strict';

const Service = require('egg').Service;

class AppointmentService extends Service {
  async create(data) {
    const { userId, labId, date, timeSlot } = data;

    const existing = await this.ctx.model.Appointment.findOne({
      where: { labId, date, timeSlot, status: ['PENDING', 'APPROVED'] },
    });

    if (existing) {
      this.ctx.throw(400, 'Time slot already booked');
    }

    return this.ctx.model.Appointment.create(data);
  }

  async findAll(query = {}) {
    const { userId, status } = query;
    const where = {};

    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.ctx.model.Appointment.findAll({
      where,
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: this.ctx.model.Lab, as: 'lab', attributes: ['id', 'name', 'location'] },
      ],
    });
  }

  async review(id, reviewData) {
    const appointment = await this.ctx.model.Appointment.findByPk(id);
    if (!appointment) {
      this.ctx.throw(404, 'Appointment not found');
    }

    await appointment.update({
      status: reviewData.status,
      reviewedBy: reviewData.reviewedBy,
      reviewTime: new Date(),
      reviewComment: reviewData.reviewComment,
    });

    await this.ctx.service.notification.create({
      userId: appointment.userId,
      title: '预约审核通知',
      content: `您的预约已${reviewData.status === 'APPROVED' ? '通过' : '拒绝'}`,
      type: 'APPOINTMENT',
      relatedId: id,
    });

    return appointment;
  }

  async cancel(id, userId) {
    const appointment = await this.ctx.model.Appointment.findByPk(id);
    if (!appointment) {
      this.ctx.throw(404, 'Appointment not found');
    }

    if (appointment.userId !== userId) {
      this.ctx.throw(403, 'Forbidden');
    }

    await appointment.update({ status: 'CANCELLED' });
    return appointment;
  }

  async findById(id) {
    const appointment = await this.ctx.model.Appointment.findByPk(id, {
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: this.ctx.model.Lab, as: 'lab' },
      ],
    });

    if (!appointment) {
      this.ctx.throw(404, 'Appointment not found');
    }

    return appointment;
  }

  async update(id, data) {
    const appointment = await this.ctx.model.Appointment.findByPk(id);
    if (!appointment) {
      this.ctx.throw(404, 'Appointment not found');
    }

    await appointment.update(data);
    return appointment;
  }

  async findMyAppointments(userId) {
    return this.ctx.model.Appointment.findAll({
      where: { userId },
      include: [
        { model: this.ctx.model.Lab, as: 'lab' },
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getPendingAppointments(query = {}) {
    const { page = 1, pageSize = 10, keyword, labId, userId, startDate, endDate, department } = query;

    const whereCondition = {
      status: 'PENDING',
    };

    // 关键词搜索
    if (keyword) {
      whereCondition[this.ctx.model.Op.or] = [
        { reason: { [this.ctx.model.Op.like]: `%${keyword}%` } },
      ];
    }

    // 实验室筛选
    if (labId) {
      whereCondition.labId = labId;
    }

    // 用户筛选
    if (userId) {
      whereCondition.userId = userId;
    }

    // 日期范围筛选
    if (startDate && endDate) {
      whereCondition.date = {
        [this.ctx.model.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await this.ctx.model.Appointment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: this.ctx.model.Lab,
          as: 'lab',
          where: department ? { department: { [this.ctx.model.Op.like]: `%${department}%` } } : undefined,
        },
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
    });

    return {
      list: rows,
      total: count,
    };
  }
}

module.exports = AppointmentService;
