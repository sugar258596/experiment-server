'use strict';

module.exports = app => {
  const { STRING, INTEGER, TEXT, BOOLEAN, DATE } = app.Sequelize;

  const Notification = app.model.define('notifications', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '通知唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    type: { type: INTEGER, allowNull: false, comment: '通知类型:0-预约审核,1-临时通知,2-预约提醒,3-设备申请,4-维修进度' },
    title: { type: STRING(200), allowNull: false, comment: '通知标题' },
    content: { type: TEXT, allowNull: false, comment: '通知内容' },
    isRead: { type: BOOLEAN, defaultValue: false, comment: '是否已读(false-未读,true-已读)' },
    relatedId: { type: STRING(100), allowNull: true, comment: '关联数据ID(如预约ID、设备申请ID等)' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Notification.associate = () => {
    app.model.Notification.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};
