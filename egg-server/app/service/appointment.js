'use strict';

const Service = require('egg').Service;

class AppointmentService extends Service {
  async create(data) {
    const { userId, labId, appointmentDate, timeSlot } = data;

    const existing = await this.ctx.model.Appointment.findOne({
      where: { labId, appointmentDate, timeSlot, status: [0, 1] },
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
      reviewerId: reviewData.reviewerId,
      reviewTime: new Date(),
      rejectionReason: reviewData.reason,
    });

    await this.ctx.service.notification.create({
      userId: appointment.userId,
      title: '预约审核通知',
      content: `您的预约已${reviewData.status === 1 ? '通过' : '拒绝'}`,
      type: 0,
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

    await appointment.update({ status: 4 });
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

  /**
   * 获取待审核预约
   * @param {Object} query - 查询参数
   * @param {number} reviewerId - 审核人ID
   * @param {string} reviewerRole - 审核人角色
   * @return {Object} 预约列表
   */
  async getPendingAppointments(query = {}, reviewerId = null, reviewerRole = null) {
    const { page = 1, pageSize = 10, keyword, labId, userId, startDate, endDate, department } = query;

    const whereCondition = {
      status: 0,
    };

    // 关键词搜索
    if (keyword) {
      whereCondition[this.app.Sequelize.Op.or] = [
        { reason: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
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
      whereCondition.appointmentDate = {
        [this.app.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // 构建实验室查询条件
    const labWhere = {};
    if (department) {
      labWhere.department = { [this.app.Sequelize.Op.like]: `%${department}%` };
    }

    // 如果是教师角色，只能查看自己创建的实验室的预约
    if (reviewerRole === 'teacher' && reviewerId) {
      labWhere.creatorId = reviewerId;
    }

    const { count, rows } = await this.ctx.model.Appointment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: this.ctx.model.Lab,
          as: 'lab',
          where: Object.keys(labWhere).length > 0 ? labWhere : undefined,
          required: reviewerRole === 'teacher', // 教师必须关联实验室
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

  /**
   * 检查用户是否有权限审核该预约
   * @param {number} appointmentId - 预约ID
   * @param {number} reviewerId - 审核人ID
   * @param {string} reviewerRole - 审核人角色
   * @return {boolean} 是否有权限
   */
  async canReviewAppointment(appointmentId, reviewerId, reviewerRole) {
    // 管理员可以审核所有预约
    if (reviewerRole === 'admin' || reviewerRole === 'super_admin') {
      return true;
    }

    // 教师只能审核自己创建的实验室的预约
    if (reviewerRole === 'teacher') {
      const appointment = await this.ctx.model.Appointment.findByPk(appointmentId, {
        include: [{ model: this.ctx.model.Lab, as: 'lab' }],
      });
      return appointment && appointment.lab && appointment.lab.creatorId === reviewerId;
    }

    return false;
  }
}

module.exports = AppointmentService;
