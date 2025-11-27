'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT, DECIMAL, JSON } = app.Sequelize;

  const Lab = app.model.define('labs', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '实验室唯一标识' },
    name: { type: STRING(100), allowNull: false, comment: '实验室名称' },
    location: { type: STRING(200), allowNull: false, comment: '实验室位置' },
    capacity: { type: INTEGER, allowNull: false, comment: '实验室容量(可容纳人数)' },
    description: { type: TEXT, allowNull: true, comment: '实验室描述' },
    images: { type: JSON, allowNull: true, comment: '实验室图片URL数组' },
    status: { type: INTEGER, defaultValue: 0, comment: '实验室状态:0-正常,1-维护中,2-停用' },
    department: { type: STRING(100), allowNull: false, comment: '所属院系/部门' },
    tags: { type: JSON, allowNull: true, comment: '实验室标签数组' },
    rating: { type: DECIMAL(3, 2), defaultValue: 0, comment: '实验室评分(0-5分,保留两位小数)' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Lab.associate = () => {
    app.model.Lab.hasMany(app.model.Appointment, { foreignKey: 'labId', as: 'appointments' });
    app.model.Lab.hasMany(app.model.Favorite, { foreignKey: 'labId', as: 'favorites' });
    app.model.Lab.hasMany(app.model.Evaluation, { foreignKey: 'labId', as: 'evaluations' });
    app.model.Lab.hasMany(app.model.Instrument, { foreignKey: 'labId', as: 'instruments' });
  };

  return Lab;
};
