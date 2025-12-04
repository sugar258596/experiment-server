'use strict';

module.exports = app => {
  const { INTEGER, DATE, TEXT } = app.Sequelize;

  const FeedbackReply = app.model.define('feedback_replies', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '回复唯一标识' },
    feedbackId: { type: INTEGER, allowNull: false, comment: '反馈ID' },
    userId: { type: INTEGER, allowNull: false, comment: '回复用户ID' },
    content: { type: TEXT, allowNull: false, comment: '回复内容' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  FeedbackReply.associate = () => {
    app.model.FeedbackReply.belongsTo(app.model.Feedback, { foreignKey: 'feedbackId', as: 'feedback' });
    app.model.FeedbackReply.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
  };

  return FeedbackReply;
};
