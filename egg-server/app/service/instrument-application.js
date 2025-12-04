'use strict';

const Service = require('egg').Service;

class InstrumentApplicationService extends Service {
  /**
   * 获取所有仪器申请
   * @param {Object} query - 查询参数
   * @param {number} reviewerId - 审核人ID
   * @param {string} reviewerRole - 审核人角色
   * @return {Promise<Object>} 仪器申请列表
   */
  async findAll(query = {}, reviewerId = null, reviewerRole = null) {
    const { page = 1, pageSize = 10, status } = query;

    const whereCondition = {};
    if (status !== undefined) {
      whereCondition.status = status;
    }

    // 构建仪器查询条件（用于关联实验室）
    let instrumentInclude = {
      model: this.ctx.model.Instrument,
      as: 'instrument',
      include: [
        {
          model: this.ctx.model.Lab,
          as: 'lab',
          attributes: ['id', 'name', 'creatorId'],
        },
      ],
    };

    // 如果是教师角色，只能查看自己创建的实验室下的仪器申请
    if (reviewerRole === 'teacher' && reviewerId) {
      instrumentInclude = {
        model: this.ctx.model.Instrument,
        as: 'instrument',
        required: true,
        include: [
          {
            model: this.ctx.model.Lab,
            as: 'lab',
            required: true,
            where: { creatorId: reviewerId },
            attributes: ['id', 'name', 'creatorId'],
          },
        ],
      };
    }

    const { count, rows } = await this.ctx.model.InstrumentApplication.findAndCountAll({
      where: whereCondition,
      include: [
        instrumentInclude,
        { model: this.ctx.model.User, as: 'applicant', attributes: ['id', 'username', 'nickname'] },
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
   * 根据用户ID获取仪器申请列表
   * @param {number} userId - 用户ID
   * @param {Object} query - 查询参数
   * @return {Promise<Object>} 仪器申请列表
   */
  async findByUserId(userId, query = {}) {
    const { page = 1, pageSize = 10, status } = query;

    const whereCondition = { applicantId: userId };
    if (status !== undefined) {
      whereCondition.status = status;
    }

    const { count, rows } = await this.ctx.model.InstrumentApplication.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: this.ctx.model.Instrument,
          as: 'instrument',
          include: [
            {
              model: this.ctx.model.Lab,
              as: 'lab',
              attributes: ['id', 'name'],
            },
          ],
        },
        { model: this.ctx.model.User, as: 'reviewer', attributes: ['id', 'username', 'nickname'] },
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
   * 申请使用仪器
   * @param {number} instrumentId - 仪器ID
   * @param {Object} user - 用户信息
   * @param {Object} data - 申请数据
   * @return {Promise<Object>} 申请结果
   */
  async apply(instrumentId, user, data) {
    const instrument = await this.ctx.model.Instrument.findByPk(instrumentId);
    if (!instrument) {
      this.ctx.throw(404, `仪器ID ${instrumentId} 不存在`);
    }

    // 仪器状态：0-正常,1-停用,2-维护中,3-故障,4-借出
    if (instrument.status !== 0) {
      this.ctx.throw(400, '该仪器当前状态不可申请使用');
    }

    // 只有待审核状态(0)的申请才阻止重复提交
    const existingApplication = await this.ctx.model.InstrumentApplication.findOne({
      where: {
        applicantId: user.sub,
        instrumentId,
        status: 0, // 只检查待审核状态
      },
    });

    if (existingApplication) {
      this.ctx.throw(400, '您已有待审核的申请，不能重复申请');
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

  /**
   * 取消仪器申请
   * @param {number} applicationId - 申请ID
   * @param {number} userId - 用户ID
   * @return {Promise<Object>} 取消结果
   */
  async cancel(applicationId, userId) {
    const application = await this.ctx.model.InstrumentApplication.findByPk(applicationId);

    if (!application) {
      this.ctx.throw(404, '申请记录不存在');
    }

    if (application.applicantId !== userId) {
      this.ctx.throw(403, '您没有权限取消此申请');
    }

    // status: 0-待审核, 1-已通过, 2-已拒绝
    if (application.status !== 0) {
      this.ctx.throw(400, '只能取消待审核状态的申请');
    }

    await application.destroy();

    return { message: '取消成功' };
  }

  /**
   * 审核仪器申请
   * @param {number} applicationId - 申请ID
   * @param {Object} reviewer - 审核人信息
   * @param {Object} reviewData - 审核数据
   * @return {Promise<Object>} 审核结果
   */
  async reviewApplication(applicationId, reviewer, reviewData) {
    const application = await this.ctx.model.InstrumentApplication.findByPk(applicationId, {
      include: [{ model: this.ctx.model.Instrument, as: 'instrument' }],
    });

    if (!application) {
      this.ctx.throw(404, '申请记录不存在');
    }

    // status: 0-待审核, 1-已通过, 2-已拒绝
    // 只支持数字或数字字符串
    let statusCode = typeof reviewData.status === 'string'
      ? parseInt(reviewData.status, 10)
      : reviewData.status;

    if (statusCode !== 1 && statusCode !== 2) {
      this.ctx.throw(400, '审核状态只能是1(已通过)或2(已拒绝)');
    }

    await application.update({
      status: statusCode,
      reviewerId: reviewer.sub,
      reviewTime: new Date(),
      rejectionReason: reviewData.reason,
    });

    // 如果通过，更新仪器状态为借出
    if (statusCode === 1) {
      await this.ctx.model.Instrument.update(
        { status: 4 },
        { where: { id: application.instrumentId } }
      );
    }

    return { message: '审核成功' };
  }

  /**
   * 归还仪器
   * @param {number} applicationId - 申请ID
   * @param {number} userId - 用户ID
   * @return {Promise<Object>} 归还结果
   */
  async returnInstrument(applicationId, userId) {
    const application = await this.ctx.model.InstrumentApplication.findByPk(applicationId, {
      include: [{ model: this.ctx.model.Instrument, as: 'instrument' }],
    });

    if (!application) {
      this.ctx.throw(404, '申请记录不存在');
    }

    // 只有申请人可以归还
    if (application.applicantId !== userId) {
      this.ctx.throw(403, '您没有权限归还此仪器');
    }

    // 只有已通过的申请才能归还
    if (application.status !== 1) {
      this.ctx.throw(400, '只有已通过的申请才能归还仪器');
    }

    // 检查仪器状态是否为借出
    if (application.instrument.status !== 4) {
      this.ctx.throw(400, '该仪器当前不是借出状态');
    }

    // 将仪器状态恢复为正常
    await this.ctx.model.Instrument.update(
      { status: 0 },
      { where: { id: application.instrumentId } }
    );

    // 更新申请状态为已归还
    await application.update({
      status: 3,
    });

    return {
      success: true,
      message: '归还成功',
    };
  }
}

module.exports = InstrumentApplicationService;
