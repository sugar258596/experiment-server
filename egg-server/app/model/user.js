'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, JSON } = app.Sequelize;

  const User = app.model.define('users', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '用户唯一标识' },
    username: { type: STRING(50), unique: true, allowNull: false, comment: '用户名，唯一标识' },
    password: { type: STRING(255), allowNull: false, comment: '用户密码(bcrypt加密)' },
    role: { type: STRING(50), defaultValue: 'student', comment: '用户角色:student-学生,teacher-教师,admin-管理员,super_admin-超级管理员' },
    status: { type: INTEGER, defaultValue: 0, comment: '用户状态:0-正常,1-禁用,2-封禁' },
    nickname: { type: STRING(100), allowNull: true, comment: '用户昵称' },
    avatar: { type: STRING(500), allowNull: true, comment: '用户头像URL' },
    email: { type: STRING(100), allowNull: true, comment: '用户邮箱' },
    phone: { type: STRING(20), allowNull: true, comment: '用户手机号' },
    department: { type: STRING(100), allowNull: true, comment: '所属院系/部门' },
    teachingTags: { type: JSON, allowNull: true, comment: '教学标签数组' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  User.associate = () => {
    app.model.User.hasMany(app.model.Appointment, { foreignKey: 'userId', as: 'appointments' });
    app.model.User.hasMany(app.model.Notification, { foreignKey: 'userId', as: 'notifications' });
    app.model.User.hasMany(app.model.Favorite, { foreignKey: 'userId', as: 'favorites' });
    app.model.User.hasMany(app.model.Evaluation, { foreignKey: 'userId', as: 'evaluations' });
    app.model.User.hasMany(app.model.News, { foreignKey: 'authorId', as: 'news' });
    app.model.User.hasMany(app.model.InstrumentApplication, { foreignKey: 'applicantId', as: 'instrumentApplications' });
    app.model.User.hasMany(app.model.Repair, { foreignKey: 'reporterId', as: 'instrumentRepairs' });
    app.model.User.hasMany(app.model.Feedback, { foreignKey: 'userId', as: 'feedbacks' });
    app.model.User.hasMany(app.model.FeedbackReply, { foreignKey: 'userId', as: 'feedbackReplies' });
  };

  return User;
};
