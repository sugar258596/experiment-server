'use strict';

module.exports = app => {
  const { INTEGER, TEXT, DATE } = app.Sequelize;

  const Evaluation = app.model.define('evaluation', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '评价记录唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    labId: { type: INTEGER, allowNull: false, comment: '实验室ID' },
    overallRating: { type: INTEGER, comment: '总体评分(1-5分)' },
    equipmentRating: { type: INTEGER, comment: '设备评分(1-5分)' },
    environmentRating: { type: INTEGER, comment: '环境评分(1-5分)' },
    serviceRating: { type: INTEGER, comment: '服务评分(1-5分)' },
    comment: { type: TEXT, comment: '评价文字内容' },
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
  };

  return Evaluation;
};
