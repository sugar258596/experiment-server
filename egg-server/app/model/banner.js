'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT, JSON } = app.Sequelize;

  const Banner = app.model.define('banners', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '轮播图ID' },
    title: { type: STRING(200), allowNull: false, comment: '轮播图标题' },
    typeId: { type: INTEGER, allowNull: false, comment: '轮播图类型ID' },
    link: { type: STRING(500), allowNull: true, comment: '链接地址' },
    description: { type: TEXT, allowNull: true, comment: '描述信息' },
    status: { type: INTEGER, defaultValue: 0, comment: '状态：0-启用，1-禁用' },
    images: { type: JSON, allowNull: true, comment: '轮播图图片URL数组' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Banner.associate = () => {
    app.model.Banner.belongsTo(app.model.BannerType, { foreignKey: 'typeId', as: 'type' });
  };

  return Banner;
};
