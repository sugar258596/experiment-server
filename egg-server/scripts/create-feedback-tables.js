'use strict';

const { Sequelize } = require('sequelize');
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
 * 创建问题反馈相关表
 * 使用方式: node scripts/create-feedback-tables.js
 */

async function createFeedbackTables() {
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE || 'experiment_egg',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    timezone: '+08:00',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: false,
    },
  });

  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');

    // 创建 feedbacks 表
    console.log('\n开始创建 feedbacks 表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '反馈唯一标识',
        userId INT NOT NULL COMMENT '反馈用户ID',
        labId INT NOT NULL COMMENT '实验室ID',
        appointmentId INT NOT NULL COMMENT '关联的预约ID',
        title VARCHAR(200) NOT NULL COMMENT '反馈标题',
        content TEXT NOT NULL COMMENT '反馈内容',
        status INT DEFAULT 0 COMMENT '状态:0-待处理,1-已回复,2-已关闭',
        createdAt DATETIME NOT NULL COMMENT '创建时间',
        updatedAt DATETIME NOT NULL COMMENT '更新时间',
        deletedAt DATETIME NULL COMMENT '软删除时间',
        INDEX idx_userId (userId),
        INDEX idx_labId (labId),
        INDEX idx_appointmentId (appointmentId),
        INDEX idx_status (status),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题反馈表'
    `);
    console.log('✅ feedbacks 表创建成功！');

    // 创建 feedback_replies 表
    console.log('\n开始创建 feedback_replies 表...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS feedback_replies (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '回复唯一标识',
        feedbackId INT NOT NULL COMMENT '反馈ID',
        userId INT NOT NULL COMMENT '回复用户ID',
        content TEXT NOT NULL COMMENT '回复内容',
        createdAt DATETIME NOT NULL COMMENT '创建时间',
        updatedAt DATETIME NOT NULL COMMENT '更新时间',
        deletedAt DATETIME NULL COMMENT '软删除时间',
        INDEX idx_feedbackId (feedbackId),
        INDEX idx_userId (userId),
        FOREIGN KEY (feedbackId) REFERENCES feedbacks(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反馈回复表'
    `);
    console.log('✅ feedback_replies 表创建成功！');

    console.log('\n═══════════════════════════════════════');
    console.log('✅ 所有表创建完成！');
    console.log('═══════════════════════════════════════\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 创建表失败:', error.message);

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

createFeedbackTables().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
