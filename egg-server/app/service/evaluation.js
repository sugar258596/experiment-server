'use strict';

const Service = require('egg').Service;

class EvaluationService extends Service {
  async create(user, data) {
    const lab = await this.ctx.model.Lab.findByPk(data.labId);

    if (!lab) {
      this.ctx.throw(404, '实验室不存在');
    }

    const evaluation = await this.ctx.model.Evaluation.create({
      userId: user.sub,
      labId: data.labId,
      overallRating: data.overallRating,
      equipmentRating: data.equipmentRating,
      environmentRating: data.environmentRating,
      serviceRating: data.serviceRating,
      comment: data.comment,
    });

    await this.updateLabRating(data.labId);

    return evaluation;
  }

  async findByLab(id) {
    return this.ctx.model.Evaluation.findAll({
      where: { labId: id },
      include: [{ model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async updateLabRating(id) {
    const evaluations = await this.ctx.model.Evaluation.findAll({
      where: { labId: id },
    });

    if (evaluations.length === 0) {
      return;
    }

    const totalRating = evaluations.reduce((sum, item) => sum + item.overallRating, 0);
    const averageRating = totalRating / evaluations.length;

    await this.ctx.model.Lab.update(
      { rating: Number(averageRating.toFixed(2)) },
      { where: { id } }
    );
  }

  async getStatistics(id) {
    const evaluations = await this.findByLab(id);

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

  async findAll() {
    return this.ctx.model.Evaluation.findAll({
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        { model: this.ctx.model.Lab, as: 'lab', attributes: ['id', 'name'] },
      ],
    });
  }

  async update(id, data) {
    const evaluation = await this.ctx.model.Evaluation.findByPk(id);
    if (!evaluation) {
      this.ctx.throw(404, 'Evaluation not found');
    }
    await evaluation.update(data);
    return evaluation;
  }

  async remove(id) {
    const evaluation = await this.ctx.model.Evaluation.findByPk(id);
    if (!evaluation) {
      this.ctx.throw(404, 'Evaluation not found');
    }
    await evaluation.destroy();
    return { message: 'Evaluation deleted' };
  }
}

module.exports = EvaluationService;
