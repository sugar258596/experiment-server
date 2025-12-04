'use strict';

const Service = require('egg').Service;

// 评价类型常量
const EVALUATION_TYPE = {
  LAB: 0, // 实验室评论
  INSTRUMENT: 1, // 仪器评价
};

// 预约/申请状态常量
const STATUS = {
  APPROVED: 1, // 已通过
};

class EvaluationService extends Service {
  /**
   * 创建实验室评论
   * @param {Object} user - 当前用户
   * @param {Object} data - 评论数据
   */
  async createLabEvaluation(user, data) {
    const { appointmentId, overallRating, equipmentRating, environmentRating, serviceRating, comment, images } = data;

    // 检查预约是否存在
    const appointment = await this.ctx.model.Appointment.findByPk(appointmentId);
    if (!appointment) {
      this.ctx.throw(404, '预约记录不存在');
    }

    // 检查预约是否属于当前用户
    if (appointment.userId !== user.sub) {
      this.ctx.throw(403, '无权评价此预约');
    }

    // 检查预约是否已审核通过
    if (appointment.status !== STATUS.APPROVED) {
      this.ctx.throw(400, '只能对审核通过的预约进行评论');
    }

    // 检查是否已评价
    const existingEvaluation = await this.ctx.model.Evaluation.findOne({
      where: { appointmentId, type: EVALUATION_TYPE.LAB },
    });
    if (existingEvaluation) {
      this.ctx.throw(400, '该预约已评价');
    }

    const evaluation = await this.ctx.model.Evaluation.create({
      userId: user.sub,
      type: EVALUATION_TYPE.LAB,
      labId: appointment.labId,
      appointmentId,
      overallRating,
      equipmentRating,
      environmentRating,
      serviceRating,
      comment,
      images: images || [],
    });

    await this.updateLabRating(appointment.labId);

    return evaluation;
  }

  /**
   * 创建仪器评价
   * @param {Object} user - 当前用户
   * @param {Object} data - 评价数据
   */
  async createInstrumentEvaluation(user, data) {
    const { instrumentApplicationId, overallRating, serviceRating, comment, images } = data;

    // 检查仪器申请是否存在
    const application = await this.ctx.model.InstrumentApplication.findByPk(instrumentApplicationId);
    if (!application) {
      this.ctx.throw(404, '仪器申请记录不存在');
    }

    // 检查申请是否属于当前用户
    if (application.applicantId !== user.sub) {
      this.ctx.throw(403, '无权评价此申请');
    }

    // 检查申请是否已审核通过
    if (application.status !== STATUS.APPROVED) {
      this.ctx.throw(400, '只能对审核通过的申请进行评价');
    }

    // 检查是否已评价
    const existingEvaluation = await this.ctx.model.Evaluation.findOne({
      where: { instrumentApplicationId, type: EVALUATION_TYPE.INSTRUMENT },
    });
    if (existingEvaluation) {
      this.ctx.throw(400, '该申请已评价');
    }

    const evaluation = await this.ctx.model.Evaluation.create({
      userId: user.sub,
      type: EVALUATION_TYPE.INSTRUMENT,
      instrumentId: application.instrumentId,
      instrumentApplicationId,
      overallRating,
      serviceRating,
      comment,
      images: images || [],
    });

    await this.updateInstrumentRating(application.instrumentId);

    return evaluation;
  }

  /**
   * 获取实验室评论列表
   */
  async findByLab(labId) {
    return this.ctx.model.Evaluation.findAll({
      where: { labId, type: EVALUATION_TYPE.LAB },
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * 获取仪器评价列表
   */
  async findByInstrument(instrumentId) {
    return this.ctx.model.Evaluation.findAll({
      where: { instrumentId, type: EVALUATION_TYPE.INSTRUMENT },
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * 更新实验室评分
   */
  async updateLabRating(labId) {
    const evaluations = await this.ctx.model.Evaluation.findAll({
      where: { labId, type: EVALUATION_TYPE.LAB },
    });

    let averageRating = 0;
    if (evaluations.length > 0) {
      const totalRating = evaluations.reduce((sum, item) => sum + item.overallRating, 0);
      averageRating = totalRating / evaluations.length;
    }

    await this.ctx.model.Lab.update(
      { rating: Number(averageRating.toFixed(2)) },
      { where: { id: labId } }
    );
  }

  /**
   * 更新仪器评分
   */
  async updateInstrumentRating(instrumentId) {
    const evaluations = await this.ctx.model.Evaluation.findAll({
      where: { instrumentId, type: EVALUATION_TYPE.INSTRUMENT },
    });

    let averageRating = 0;
    if (evaluations.length > 0) {
      const totalRating = evaluations.reduce((sum, item) => sum + item.overallRating, 0);
      averageRating = totalRating / evaluations.length;
    }

    await this.ctx.model.Instrument.update(
      { rating: Number(averageRating.toFixed(2)) },
      { where: { id: instrumentId } }
    );
  }

  /**
   * 获取实验室评价统计
   */
  async getLabStatistics(labId) {
    const evaluations = await this.findByLab(labId);

    if (evaluations.length === 0) {
      return {
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    evaluations.forEach(item => {
      ratingDistribution[item.overallRating] += 1;
    });

    const totalRating = evaluations.reduce((sum, item) => sum + item.overallRating, 0);
    const averageRating = totalRating / evaluations.length;

    return {
      totalCount: evaluations.length,
      averageRating: averageRating.toFixed(2),
      ratingDistribution,
    };
  }

  /**
   * 获取仪器评价统计
   */
  async getInstrumentStatistics(instrumentId) {
    const evaluations = await this.findByInstrument(instrumentId);

    if (evaluations.length === 0) {
      return {
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    evaluations.forEach(item => {
      ratingDistribution[item.overallRating] += 1;
    });

    const totalRating = evaluations.reduce((sum, item) => sum + item.overallRating, 0);
    const averageRating = totalRating / evaluations.length;

    return {
      totalCount: evaluations.length,
      averageRating: averageRating.toFixed(2),
      ratingDistribution,
    };
  }

  /**
   * 获取所有评价列表
   */
  async findAll(query = {}) {
    const where = {};
    if (query.type !== undefined) {
      where.type = query.type;
    }

    return this.ctx.model.Evaluation.findAll({
      where,
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: this.ctx.model.Lab, as: 'lab', attributes: ['id', 'name'] },
        { model: this.ctx.model.Instrument, as: 'instrument', attributes: ['id', 'name'] },
        { model: this.ctx.model.Appointment, as: 'appointment' },
        { model: this.ctx.model.InstrumentApplication, as: 'instrumentApplication' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * 删除评价（只能删除自己的评价）
   */
  async remove(user, id) {
    const evaluation = await this.ctx.model.Evaluation.findByPk(id);
    if (!evaluation) {
      this.ctx.throw(404, '评价不存在');
    }

    // 检查是否是自己的评价
    if (evaluation.userId !== user.sub) {
      this.ctx.throw(403, '无权删除此评价');
    }

    const { type, labId, instrumentId } = evaluation;
    await evaluation.destroy();

    // 更新评分
    if (type === EVALUATION_TYPE.LAB && labId) {
      await this.updateLabRating(labId);
    } else if (type === EVALUATION_TYPE.INSTRUMENT && instrumentId) {
      await this.updateInstrumentRating(instrumentId);
    }

    return { message: '删除成功' };
  }

  /**
   * 上传评价图片
   * @param {Object} file - 上传的文件
   * @return {string} 图片URL（完整URL）
   */
  async uploadImage(file) {
    const fs = require('fs');
    const path = require('path');

    const uploadDir = path.join(this.app.baseDir, 'app/public/uploads/evaluations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.filename);
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    const targetPath = path.join(uploadDir, filename);

    const reader = fs.createReadStream(file.filepath);
    const writer = fs.createWriteStream(targetPath);
    reader.pipe(writer);

    // 清理临时文件
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // 从环境变量获取服务器配置
    const protocol = process.env.SERVET_AGREEMENT || 'http';
    const host = process.env.SERVET_HOST || 'localhost';
    const port = process.env.SERVET_PORT || '7001';
    const staticPrefix = process.env.SERVET_FILE_STATIC || this.app.config.static.prefix || '/static';

    // 构建完整的URL
    const serverUrl = `${protocol}://${host}:${port}`;
    return `${serverUrl}${staticPrefix}/uploads/evaluations/${filename}`;
  }

  /**
   * 根据预约ID查找实验室评论
   */
  async findByAppointmentId(appointmentId) {
    return this.ctx.model.Evaluation.findOne({
      where: { appointmentId, type: EVALUATION_TYPE.LAB },
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: this.ctx.model.Lab, as: 'lab', attributes: ['id', 'name'] },
      ],
    });
  }

  /**
   * 根据仪器申请ID查找评价
   */
  async findByInstrumentApplicationId(instrumentApplicationId) {
    return this.ctx.model.Evaluation.findOne({
      where: { instrumentApplicationId, type: EVALUATION_TYPE.INSTRUMENT },
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: this.ctx.model.Instrument, as: 'instrument', attributes: ['id', 'name'] },
      ],
    });
  }

  /**
   * 根据实验室ID查找评论列表
   */
  async findByLab(labId) {
    return this.ctx.model.Evaluation.findAll({
      where: { labId, type: EVALUATION_TYPE.LAB },
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * 根据仪器ID查找评价列表
   */
  async findByInstrument(instrumentId) {
    return this.ctx.model.Evaluation.findAll({
      where: { instrumentId, type: EVALUATION_TYPE.INSTRUMENT },
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = EvaluationService;
