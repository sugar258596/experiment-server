'use strict';

const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// 加载环境变量配置
const envFile = path.join(__dirname, '../.env.development');
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
} else {
  require('dotenv').config();
}

/**
 * 初始化超级管理员账号脚本
 * 使用方式: pnpm run init:admin
 */

async function initAdmin() {
  // 创建数据库连接
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE || 'experiment_egg',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    timezone: '+08:00',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  });

  // 定义用户模型
  const User = sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户唯一标识'
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: '用户名，唯一标识'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '用户密码(bcrypt加密)'
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'student',
      comment: '用户角色:student-学生,teacher-教师,admin-管理员,super_admin-超级管理员'
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '用户状态:0-正常,1-禁用,2-封禁'
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '用户昵称'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户头像URL'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '用户邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '用户手机号'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '所属院系/部门'
    },
    teachingTags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '教学标签数组(逗号分隔)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '创建时间'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '更新时间'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '软删除时间'
    },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');

    // 默认超级管理员配置
    const adminConfig = {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || '258956',
      email: process.env.ADMIN_EMAIL || 'admin@lab.system.com',
      nickname: '系统管理员',
      role: 'super_admin',
      status: 0, // 0-正常
      department: '系统管理部',
    };

    // 检查管理员账号是否已存在
    const existingAdmin = await User.findOne({
      where: { username: adminConfig.username },
    });

    if (existingAdmin) {
      console.log(`\n⚠️  管理员账号 "${adminConfig.username}" 已存在！`);
      console.log('账号信息:');
      console.log(`  - 用户名: ${existingAdmin.username}`);
      console.log(`  - 邮箱: ${existingAdmin.email}`);
      console.log(`  - 角色: ${existingAdmin.role}`);
      console.log(`  - 创建时间: ${existingAdmin.createdAt}`);
      console.log('\n如需重置密码，请手动删除该账号后重新运行此脚本。\n');
      await sequelize.close();
      process.exit(0);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

    // 创建管理员账号
    const admin = await User.create({
      ...adminConfig,
      password: hashedPassword,
    });

    console.log('\n✅ 超级管理员账号创建成功！\n');
    console.log('═══════════════════════════════════════');
    console.log('账号信息:');
    console.log(`  用户名: ${admin.username}`);
    console.log(`  密码: ${adminConfig.password}`);
    console.log(`  邮箱: ${admin.email}`);
    console.log(`  昵称: ${admin.nickname}`);
    console.log(`  角色: ${admin.role}`);
    console.log(`  部门: ${admin.department}`);
    console.log('═══════════════════════════════════════\n');
    console.log('⚠️  请妥善保管管理员账号信息！');
    console.log('⚠️  建议登录后立即修改默认密码！\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 创建管理员账号失败:', error.message);

    if (error.name === 'SequelizeConnectionError') {
      console.error('\n数据库连接失败，请检查:');
      console.error('  1. MySQL 服务是否启动');
      console.error('  2. .env 文件中的数据库配置是否正确');
      console.error('  3. 数据库是否已创建\n');
    }

    await sequelize.close();
    process.exit(1);
  }
}

// 执行初始化
initAdmin().catch(err => {
  console.error('初始化脚本执行失败:', err);
  process.exit(1);
});
