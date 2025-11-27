'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

  const BannerType = app.model.define('banner_types', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '轮播图类型ID' },
    name: { type: STRING(100), unique: true, allowNull: false, comment: '类型名称' },
    description: { type: TEXT, allowNull: true, comment: '类型描述' },
    status: { type: INTEGER, defaultValue: 0, comment: '状态：0-启用，1-禁用' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  BannerType.associate = () => {
    app.model.BannerType.hasMany(app.model.Banner, { foreignKey: 'typeId', as: 'banners' });
  };

  return BannerType;
};
