'use strict';

const Service = require('egg').Service;

class NotificationService extends Service {
  async create(data) {
    return this.ctx.model.Notification.create(data);
  }

  async findByUser(userId) {
    return this.ctx.model.Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async markAsRead(id, userId) {
    const notification = await this.ctx.model.Notification.findByPk(id);
    if (!notification) {
      this.ctx.throw(404, 'Notification not found');
    }

    if (notification.userId !== userId) {
      this.ctx.throw(403, 'Forbidden');
    }

    await notification.update({ read: true });
    return notification;
  }

  async delete(id, userId) {
    const notification = await this.ctx.model.Notification.findByPk(id);
    if (!notification) {
      this.ctx.throw(404, 'Notification not found');
    }

    if (notification.userId !== userId) {
      this.ctx.throw(403, 'Forbidden');
    }

    await notification.destroy();
    return { message: 'Notification deleted successfully' };
  }

  async getUnreadCount(userId) {
    return this.ctx.model.Notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async findAll(query = {}) {
    const { keyword, userId, page = 1, pageSize = 10 } = query;

    const whereCondition = {};

    if (userId) {
      whereCondition.userId = userId;
    }

    if (keyword) {
      whereCondition[this.app.Sequelize.Op.or] = [
        { title: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
        { content: { [this.app.Sequelize.Op.like]: `%${keyword}%` } },
      ];
    }

    const { count, rows } = await this.ctx.model.Notification.findAndCountAll({
      where: whereCondition,
      include: [
        { model: this.ctx.model.User, as: 'user', attributes: ['id', 'username', 'nickname'] },
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
    };
  }

  async markAllAsRead(userId) {
    await this.ctx.model.Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );
    return { message: '所有通知已标记为已读' };
  }

  async remove(id, userId) {
    const notification = await this.ctx.model.Notification.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      this.ctx.throw(404, '通知不存在');
    }

    await notification.destroy();
    return { message: '通知已删除' };
  }
}

module.exports = NotificationService;
