'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT, JSON } = app.Sequelize;

  const Repair = app.model.define('instrument_repairs', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '维修单唯一标识' },
    repairNumber: { type: STRING(50), unique: true, allowNull: false, comment: '维修单号(唯一)' },
    instrumentId: { type: INTEGER, allowNull: false, comment: '仪器ID' },
    reporterId: { type: INTEGER, allowNull: false, comment: '报告人ID' },
    faultType: { type: INTEGER, allowNull: false, comment: '故障类型:0-硬件故障,1-软件故障,2-操作错误,3-其他' },
    description: { type: TEXT, allowNull: false, comment: '故障详细描述' },
    images: { type: JSON, allowNull: true, comment: '故障图片URL数组' },
    urgency: { type: INTEGER, defaultValue: 1, comment: '紧急程度:0-低,1-中,2-高,3-紧急' },
    status: { type: INTEGER, defaultValue: 0, comment: '维修状态:0-待处理,1-维修中,2-已完成' },
    assigneeId: { type: INTEGER, allowNull: true, comment: '维修负责人ID' },
    repairSummary: { type: TEXT, allowNull: true, comment: '维修总结' },
    completedAt: { type: DATE, allowNull: true, comment: '完成时间' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Repair.associate = () => {
    app.model.Repair.belongsTo(app.model.Instrument, { foreignKey: 'instrumentId', as: 'instrument' });
    app.model.Repair.belongsTo(app.model.User, { foreignKey: 'reporterId', as: 'reporter' });
    app.model.Repair.belongsTo(app.model.User, { foreignKey: 'assigneeId', as: 'assignee' });
  };

  return Repair;
};
