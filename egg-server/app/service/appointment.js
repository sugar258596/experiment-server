'use strict';

const Service = require('egg').Service;

class AppointmentService extends Service {
  async create(data) {
    const { userId, labId, appointmentDate, timeSlot } = data;

    // 获取实验室信息
    const lab = await this.ctx.model.Lab.findByPk(labId);
    if (!lab) {
      this.ctx.throw(404, '实验室不存在');
    }

    // 检查该用户是否已经预约了同一时段
    const userExisting = await this.ctx.model.Appointment.findOne({
      where: {
        userId,
        labId,
        appointmentDate,
        timeSlot,
        status: [0, 1], // 待审核或已通过
      },
    });

    if (userExisting) {
      this.ctx.throw(400, '您已预约该时段，请勿重复预约');
    }

    // 检查该时段的预约数量是否已达到实验室容量
    const Op = this.app.Sequelize.Op;
    const approvedCount = await this.ctx.model.Appointment.count({
      where: {
        labId,
        appointmentDate,
        timeSlot,
        status: [0, 1], // 待审核或已通过
      },
    });

    if (approvedCount >= lab.capacity) {
      this.ctx.throw(400, '该时段预约已满，请选择其他时段');
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

    // 使用 == 进行宽松比较，避免类型不一致导致的问题
    if (String(appointment.userId) !== String(userId)) {
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
    const appointments = await this.ctx.model.Appointment.findAll({
      where: { userId },
      include: [
        { model: this.ctx.model.Lab, as: 'lab' },
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // 为每个预约添加是否已评论的标志
    const appointmentsWithEvaluation = await Promise.all(
      appointments.map(async (appointment) => {
        const evaluation = await this.ctx.model.Evaluation.findOne({
          where: { appointmentId: appointment.id, type: 0 },
        });

        const plainAppointment = appointment.toJSON();
        plainAppointment.hasEvaluation = !!evaluation;
        return plainAppointment;
      })
    );

    return appointmentsWithEvaluation;
  }

  /**
   * 获取待审核预约
   * @param {Object} query - 查询参数
   * @param {number} reviewerId - 审核人ID
   * @param {string} reviewerRole - 审核人角色
   * @return {Object} 预约列表
   */
  async getPendingAppointments(query = {}, reviewerId = null, reviewerRole = null) {
    const { page = 1, pageSize = 10, keyword, labId, userId, startDate, endDate, department, creatorId } = query;

    const whereCondition = {
      status: 0,
    };

    // 关键词搜索
    if (keyword) {
      whereCondition[this.app.Sequelize.Op.or] = [
        { reason: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    // 实验室筛选 - 当有实验室ID时才按实验室筛选
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

    // 创建者筛选（管理员可以通过 creatorId 参数筛选）
    if (creatorId) {
      labWhere.creatorId = creatorId;
    }

    // 教师角色权限控制：
    // 1. 如果没有指定实验室ID，获取该教师创建的所有实验室的申请
    // 2. 如果指定了实验室ID，则通过上面的 whereCondition.labId 筛选
    // 管理员角色：获取全部申请，但可以通过 creatorId 参数筛选
    if (reviewerRole === 'teacher' && reviewerId && !labId && !creatorId) {
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
