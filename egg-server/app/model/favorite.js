'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;

  const Favorite = app.model.define('favorite', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '收藏记录唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    labId: { type: INTEGER, allowNull: false, comment: '实验室ID' },
    createdAt: { type: DATE, comment: '收藏时间' },
    deletedAt: { type: DATE, comment: '软删除时间' },
  }, {
    tableName: 'favorites',
    paranoid: true,
    updatedAt: false,
  });

  Favorite.associate = () => {
    app.model.Favorite.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    app.model.Favorite.belongsTo(app.model.Lab, { foreignKey: 'labId', as: 'lab' });
  };

  return Favorite;
};
