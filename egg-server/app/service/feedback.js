'use strict';

const Service = require('egg').Service;

class FeedbackService extends Service {
  /**
   * 创建反馈
   * @param {Object} data - 反馈数据
   * @return {Object} 创建的反馈
   */
  async create(data) {
    const { userId, appointmentId, title, content } = data;

    // 验证预约是否存在且已通过
    const appointment = await this.ctx.model.Appointment.findByPk(appointmentId);
    if (!appointment) {
      this.ctx.throw(404, '预约不存在');
    }
    if (appointment.status !== 1 && appointment.status !== 4) {
      this.ctx.throw(400, '只有已通过或已完成的预约才能提交反馈');
    }
    if (String(appointment.userId) !== String(userId)) {
      this.ctx.throw(403, '只能对自己的预约提交反馈');
    }

    return this.ctx.model.Feedback.create({
      userId,
      labId: appointment.labId,
      appointmentId,
      title,
      content,
      status: 0,
    });
  }

  /**
   * 获取反馈列表
   * @param {Object} query - 查询参数
   * @param {number} userId - 当前用户ID
   * @param {string} userRole - 用户角色
   * @return {Object} 反馈列表
   */
  async findAll(query = {}, userId, userRole) {
    const { page = 1, pageSize = 10, labId, status } = query;
    const { Op } = this.app.Sequelize;

    const whereCondition = {};
    const labWhere = {};

    // 按实验室筛选
    if (labId) {
      whereCondition.labId = labId;
    }

    // 按状态筛选
    if (status !== undefined && status !== '') {
      whereCondition.status = status;
    }

    // 权限控制：学生只能看自己的反馈
    if (userRole === 'student') {
      whereCondition.userId = userId;
    } else if (userRole === 'teacher') {
      // 教师只能看自己创建的实验室下的反馈
      labWhere.creatorId = userId;
    }
    // admin和super_admin可以看所有

    const { count, rows } = await this.ctx.model.Feedback.findAndCountAll({
      where: whereCondition,
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        {
          model: this.ctx.model.Lab,
          as: 'lab',
          attributes: ['id', 'name', 'location'],
          where: Object.keys(labWhere).length > 0 ? labWhere : undefined,
          required: userRole === 'teacher',
        },
        { model: this.ctx.model.Appointment, as: 'appointment', attributes: ['id', 'appointmentDate', 'timeSlot'] },
        {
          model: this.ctx.model.FeedbackReply,
          as: 'replies',
          include: [{ model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }],
        },
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return { list: rows, total: count };
  }

  /**
   * 获取反馈详情
   * @param {number} id - 反馈ID
   * @return {Object} 反馈详情
   */
  async findById(id) {
    const feedback = await this.ctx.model.Feedback.findByPk(id, {
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: this.ctx.model.Lab, as: 'lab' },
        { model: this.ctx.model.Appointment, as: 'appointment' },
        {
          model: this.ctx.model.FeedbackReply,
          as: 'replies',
          include: [{ model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar', 'role'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!feedback) {
      this.ctx.throw(404, '反馈不存在');
    }

    return feedback;
  }

  /**
   * 检查用户是否有权限回复反馈
   * @param {number} feedbackId - 反馈ID
   * @param {number} userId - 用户ID
   * @param {string} userRole - 用户角色
   * @return {boolean} 是否有权限
   */
  async canReply(feedbackId, userId, userRole) {
    // 管理员可以回复所有反馈
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true;
    }

    // 教师只能回复自己创建的实验室下的反馈
    if (userRole === 'teacher') {
      const feedback = await this.ctx.model.Feedback.findByPk(feedbackId, {
        include: [{ model: this.ctx.model.Lab, as: 'lab' }],
      });
      return feedback && feedback.lab && String(feedback.lab.creatorId) === String(userId);
    }

    return false;
  }

  /**
   * 回复反馈
   * @param {number} feedbackId - 反馈ID
   * @param {Object} data - 回复数据
   * @return {Object} 创建的回复
   */
  async reply(feedbackId, data) {
    const { userId, content } = data;

    const feedback = await this.ctx.model.Feedback.findByPk(feedbackId);
    if (!feedback) {
      this.ctx.throw(404, '反馈不存在');
    }

    const reply = await this.ctx.model.FeedbackReply.create({
      feedbackId,
      userId,
      content,
    });

    // 更新反馈状态为已回复
    if (feedback.status === 0) {
      await feedback.update({ status: 1 });
    }

    // 发送通知给反馈提交者
    await this.ctx.service.notification.create({
      userId: feedback.userId,
      title: '反馈回复通知',
      content: `您的反馈"${feedback.title}"收到了新回复`,
      type: 0,
      relatedId: feedbackId,
    });

    return reply;
  }

  /**
   * 关闭反馈
   * @param {number} id - 反馈ID
   * @param {number} userId - 操作用户ID
   * @param {string} userRole - 用户角色
   * @return {Object} 更新后的反馈
   */
  async close(id, userId, userRole) {
    const feedback = await this.ctx.model.Feedback.findByPk(id, {
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });

    if (!feedback) {
      this.ctx.throw(404, '反馈不存在');
    }

    // 权限检查
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    const isLabCreator = userRole === 'teacher' && feedback.lab && String(feedback.lab.creatorId) === String(userId);

    if (!isAdmin && !isLabCreator) {
      this.ctx.throw(403, '没有权限关闭此反馈');
    }

    await feedback.update({ status: 2 });
    return feedback;
  }
}

module.exports = FeedbackService;
