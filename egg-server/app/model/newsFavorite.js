'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;

  const NewsFavorite = app.model.define('news_favorite', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '收藏记录唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    newsId: { type: INTEGER, allowNull: false, comment: '动态ID' },
    createdAt: { type: DATE, comment: '收藏时间' },
    deletedAt: { type: DATE, comment: '软删除时间' },
  }, {
    tableName: 'news_favorites',
    paranoid: true,
    updatedAt: false,
    indexes: [
      {
        name: 'idx_userId_newsId',
        unique: true,
        fields: ['userId', 'newsId'],
        comment: '用户ID和动态ID的唯一索引，防止重复收藏',
      },
    ],
  });

  NewsFavorite.associate = () => {
    app.model.NewsFavorite.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    app.model.NewsFavorite.belongsTo(app.model.News, { foreignKey: 'newsId', as: 'news' });
  };

  return NewsFavorite;
};
