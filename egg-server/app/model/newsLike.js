'use strict';

module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;

  const NewsLike = app.model.define('news_like', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '点赞记录唯一标识' },
    userId: { type: INTEGER, allowNull: false, comment: '用户ID' },
    newsId: { type: INTEGER, allowNull: false, comment: '动态ID' },
    createdAt: { type: DATE, comment: '点赞时间' },
    deletedAt: { type: DATE, comment: '软删除时间' },
  }, {
    tableName: 'news_likes',
    paranoid: true,
    updatedAt: false,
    indexes: [
      {
        name: 'idx_userId_newsId',
        unique: true,
        fields: ['userId', 'newsId'],
        comment: '用户ID和动态ID的唯一索引，防止重复点赞',
      },
    ],
  });

  NewsLike.associate = () => {
    app.model.NewsLike.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    app.model.NewsLike.belongsTo(app.model.News, { foreignKey: 'newsId', as: 'news' });
  };

  return NewsLike;
};
