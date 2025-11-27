'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT, DATEONLY } = app.Sequelize;

  const Appointment = app.model.define('appointments', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '预约单唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    labId: { type: INTEGER, allowNull: false, comment: '实验室ID' },
    appointmentDate: { type: DATEONLY, allowNull: false, comment: '预约日期' },
    timeSlot: { type: INTEGER, defaultValue: 0, comment: '时间段:0-上午,1-下午,2-晚上' },
    purpose: { type: TEXT, allowNull: false, comment: '预约目的' },
    description: { type: TEXT, allowNull: false, comment: '详细描述' },
    participantCount: { type: INTEGER, allowNull: false, comment: '参与人数' },
    status: { type: INTEGER, defaultValue: 0, comment: '预约状态:0-待审核,1-已通过,2-已拒绝,3-已取消,4-已完成' },
    rejectionReason: { type: TEXT, allowNull: true, comment: '拒绝原因' },
    reviewerId: { type: INTEGER, allowNull: true, comment: '审核人ID' },
    reviewTime: { type: DATE, allowNull: true, comment: '审核时间' },
    startTime: { type: DATE, allowNull: true, comment: '实际开始时间' },
    endTime: { type: DATE, allowNull: true, comment: '实际结束时间' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Appointment.associate = () => {
    app.model.Appointment.belongsTo(app.model.Lab, { foreignKey: 'labId', as: 'lab' });
    app.model.Appointment.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    app.model.Appointment.belongsTo(app.model.User, { foreignKey: 'reviewerId', as: 'reviewer' });
  };

  return Appointment;
};
