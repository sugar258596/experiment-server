'use strict';

const Service = require('egg').Service;

class FavoriteService extends Service {
  async getMyFavorites(userId, query = {}) {
    const { keyword, department, labId, page = 1, pageSize = 10 } = query;
    const where = { userId };
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;
    const labWhere = {};

    if (keyword) {
      labWhere[this.app.Sequelize.Op.or] = [
        { name: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { description: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    if (department) {
      labWhere.department = department;
    }

    if (labId) {
      labWhere.id = labId;
    }

    const { count, rows } = await this.ctx.model.Favorite.findAndCountAll({
      where,
      include: [{ model: this.ctx.model.Lab, as: 'lab', where: labWhere }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { list: rows, total: count };
  }

  async toggle(userId, labId) {
    const user = await this.ctx.model.User.findByPk(userId);
    const lab = await this.ctx.model.Lab.findByPk(labId);

    if (!user) {
      this.ctx.throw(404, '用户不存在');
    }

    if (!lab) {
      this.ctx.throw(404, '实验室不存在');
    }

    const existingFavorite = await this.ctx.model.Favorite.findOne({
      where: { userId, labId },
    });

    if (existingFavorite) {
      await existingFavorite.destroy();
      return { isFavorited: false, message: '已取消收藏' };
    }

    await this.ctx.model.Favorite.create({ userId, labId });
    return { message: '收藏成功' };
  }

  async findAll(userId) {
    return this.ctx.model.Favorite.findAll({
      where: { userId },
      include: [{ model: this.ctx.model.Lab, as: 'lab' }],
    });
  }

  async create(userId, labId) {
    return this.ctx.model.Favorite.create({
      userId,
      labId,
    });
  }

  async remove(id) {
    const favorite = await this.ctx.model.Favorite.findByPk(id);
    if (!favorite) {
      this.ctx.throw(404, 'Favorite not found');
    }
    await favorite.destroy();
    return { message: 'Favorite removed' };
  }
}

module.exports = FavoriteService;
