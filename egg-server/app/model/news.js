'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT, JSON } = app.Sequelize;

  const News = app.model.define('news', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '新闻公告唯一标识' },
    title: { type: STRING(200), allowNull: false, comment: '新闻标题' },
    content: { type: TEXT, allowNull: false, comment: '新闻内容' },
    coverImage: { type: TEXT, allowNull: true, comment: '封面图片URL' },
    images: { type: JSON, allowNull: true, comment: '新闻图片URL数组' },
    tags: { type: JSON, allowNull: true, comment: '新闻标签数组' },
    status: { type: INTEGER, defaultValue: 0, comment: '新闻状态:0-待审核,1-已发布,2-已拒绝' },
    likes: { type: INTEGER, defaultValue: 0, comment: '点赞数' },
    favorites: { type: INTEGER, defaultValue: 0, comment: '收藏数' },
    authorId: { type: INTEGER, allowNull: false, comment: '作者ID' },
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

  News.associate = () => {
    app.model.News.belongsTo(app.model.User, { foreignKey: 'authorId', as: 'author' });
    app.model.News.belongsTo(app.model.User, { foreignKey: 'reviewerId', as: 'reviewer' });
  };

  return News;
};
