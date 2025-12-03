'use strict';

module.exports = app => {
  const { INTEGER, TEXT, DATE, JSON } = app.Sequelize;

  const Evaluation = app.model.define('evaluation', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '评价记录唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    type: { type: INTEGER, allowNull: false, defaultValue: 0, comment: '评价类型:0-实验室评论,1-仪器评价' },
    labId: { type: INTEGER, allowNull: true, comment: '实验室ID' },
    instrumentId: { type: INTEGER, allowNull: true, comment: '仪器ID' },
    appointmentId: { type: INTEGER, allowNull: true, comment: '关联实验室预约ID' },
    instrumentApplicationId: { type: INTEGER, allowNull: true, comment: '关联仪器申请ID' },
    overallRating: { type: INTEGER, comment: '总体评分(1-5分)' },
    equipmentRating: { type: INTEGER, comment: '设备评分(1-5分)' },
    environmentRating: { type: INTEGER, comment: '环境评分(1-5分)' },
    serviceRating: { type: INTEGER, comment: '服务评分(1-5分)' },
    comment: { type: TEXT, comment: '评价文字内容' },
    images: { type: JSON, defaultValue: [], comment: '评价图片列表' },
    createdAt: { type: DATE, comment: '评价时间' },
    updatedAt: { type: DATE, comment: '更新时间' },
    deletedAt: { type: DATE, comment: '软删除时间' },
  }, {
    tableName: 'evaluations',
    paranoid: true,
  });

  Evaluation.associate = () => {
    app.model.Evaluation.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    app.model.Evaluation.belongsTo(app.model.Lab, { foreignKey: 'labId', as: 'lab' });
    app.model.Evaluation.belongsTo(app.model.Instrument, { foreignKey: 'instrumentId', as: 'instrument' });
    app.model.Evaluation.belongsTo(app.model.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
    app.model.Evaluation.belongsTo(app.model.InstrumentApplication, { foreignKey: 'instrumentApplicationId', as: 'instrumentApplication' });
  };

  return Evaluation;
};
