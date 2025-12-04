'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

  const InstrumentApplication = app.model.define('instrument_applications', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '申请表唯一标识' },
    instrumentId: { type: INTEGER, allowNull: false, comment: '仪器ID' },
    applicantId: { type: INTEGER, allowNull: false, comment: '申请人ID' },
    purpose: { type: STRING(200), allowNull: false, comment: '使用目的' },
    description: { type: TEXT, allowNull: false, comment: '详细描述' },
    startTime: { type: DATE, allowNull: false, comment: '使用开始时间' },
    endTime: { type: DATE, allowNull: false, comment: '使用结束时间' },
    status: { type: INTEGER, defaultValue: 0, comment: '申请状态:0-待审核,1-已通过,2-已拒绝,3-已归还' },
    rejectionReason: { type: STRING(500), allowNull: true, comment: '拒绝原因' },
    reviewerId: { type: INTEGER, allowNull: true, comment: '审核人ID' },
    reviewTime: { type: DATE, allowNull: true, comment: '审核时间' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  InstrumentApplication.associate = () => {
    app.model.InstrumentApplication.belongsTo(app.model.Instrument, { foreignKey: 'instrumentId', as: 'instrument' });
    app.model.InstrumentApplication.belongsTo(app.model.User, { foreignKey: 'applicantId', as: 'applicant' });
    app.model.InstrumentApplication.belongsTo(app.model.User, { foreignKey: 'reviewerId', as: 'reviewer' });
  };

  return InstrumentApplication;
};
