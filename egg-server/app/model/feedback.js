'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

  const Feedback = app.model.define('feedbacks', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '反馈唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '反馈用户ID' },
    labId: { type: INTEGER, allowNull: false, comment: '实验室ID' },
    appointmentId: { type: INTEGER, allowNull: false, comment: '关联的预约ID' },
    title: { type: STRING(200), allowNull: false, comment: '反馈标题' },
    content: { type: TEXT, allowNull: false, comment: '反馈内容' },
    status: { type: INTEGER, defaultValue: 0, comment: '状态:0-待处理,1-已回复,2-已关闭' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Feedback.associate = () => {
    app.model.Feedback.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    app.model.Feedback.belongsTo(app.model.Lab, { foreignKey: 'labId', as: 'lab' });
    app.model.Feedback.belongsTo(app.model.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
    app.model.Feedback.hasMany(app.model.FeedbackReply, { foreignKey: 'feedbackId', as: 'replies' });
  };

  return Feedback;
};
