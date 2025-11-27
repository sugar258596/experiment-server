'use strict';

const Service = require('egg').Service;

class NewsService extends Service {
  async create(data, user) {
    if (!user || !user.id) {
      this.ctx.throw(400, '用户信息不完整,无法创建新闻');
    }

    return this.ctx.model.News.create({
      ...data,
      authorId: user.id,
      status: 'APPROVED',
    });
  }

  async findAll(query = {}) {
    const { keyword, tag, page = 1, pageSize = 10 } = query;
    const where = { status: 'APPROVED' };
    const offset = (page - 1) * pageSize;

    if (keyword) {
      where[this.app.Sequelize.Op.or] = [
        { title: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { content: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    if (tag) {
      where.tags = { [this.app.Sequelize.Op.contains]: [tag] };
    }

    const { count, rows } = await this.ctx.model.News.findAndCountAll({
      where,
      include: [{ model: this.ctx.model.User, as: 'author', attributes: ['id', 'username', 'nickname'] }],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    return { data: rows, total: count };
  }

  async findOne(id) {
    const news = await this.ctx.model.News.findByPk(id, {
      include: [{ model: this.ctx.model.User, as: 'author', attributes: ['id', 'username', 'nickname'] }],
    });

    if (!news) {
      this.ctx.throw(404, `动态ID ${id} 不存在`);
    }

    return news;
  }

  async like(id) {
    const news = await this.findOne(id);
    await news.increment('likes', { by: 1 });
    return news.reload();
  }

  async getPendingNews() {
    return this.ctx.model.News.findAll({
      where: { status: 'PENDING' },
      include: [{ model: this.ctx.model.User, as: 'author', attributes: ['id', 'username', 'nickname'] }],
      order: [['createdAt', 'ASC']],
    });
  }

  async review(id, approved, currentUser) {
    if (currentUser && !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      this.ctx.throw(403, '需要管理员权限才能审核新闻');
    }

    const news = await this.findOne(id);
    const updateData = {
      status: approved ? 'APPROVED' : 'REJECTED',
    };

    if (currentUser) {
      updateData.reviewerId = currentUser.id;
      updateData.reviewTime = new Date();
    }

    await news.update(updateData);
    return news;
  }

  async update(id, data) {
    const news = await this.ctx.model.News.findByPk(id);
    if (!news) {
      this.ctx.throw(404, 'News not found');
    }
    await news.update(data);
    return news;
  }

  async remove(id) {
    const news = await this.ctx.model.News.findByPk(id);
    if (!news) {
      this.ctx.throw(404, 'News not found');
    }
    await news.destroy();
    return { message: 'News deleted' };
  }
}

module.exports = NewsService;
