'use strict';

const Service = require('egg').Service;

class InstrumentApplicationService extends Service {
  /**
   * 获取所有仪器申请
   * @return {Promise<Array>} 仪器申请列表
   */
  async findAll() {
    return this.ctx.model.InstrumentApplication.findAll({
      include: [
        { model: this.ctx.model.Instrument, as: 'instrument' },
        { model: this.ctx.model.User, as: 'applicant', attributes: ['id', 'username', 'nickname'] },
      ],
    });
  }

  /**
   * 创建仪器申请
   * @param {Object} data - 申请数据
   * @return {Promise<Object>} 创建的申请
   */
  async create(data) {
    return this.ctx.model.InstrumentApplication.create(data);
  }

  /**
   * 审核仪器申请
   * @param {number} id - 申请ID
   * @param {Object} reviewData - 审核数据
   * @param {number} reviewerId - 审核人ID
   * @return {Promise<Object>} 更新后的申请
   */
  async review(id, reviewData, reviewerId) {
    const application = await this.ctx.model.InstrumentApplication.findByPk(id);
    if (!application) {
      this.ctx.throw(404, 'Application not found');
    }

    await application.update({
      status: reviewData.status,
      reviewerId,
      reviewTime: new Date(),
      rejectionReason: reviewData.rejectionReason,
    });

    return application;
  }
}

module.exports = InstrumentApplicationService;
