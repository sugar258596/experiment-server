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
 * 为 labs 表添加 creatorId 字段以支持创建者追踪
 * 使用方式: node scripts/add-lab-creatorId.js
 */

async function addLabCreatorId() {
  // 创建数据库连接
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
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');

    // 检查字段是否已存在
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM labs LIKE 'creatorId'
    `);

    if (columns && columns.length > 0) {
      console.log('\n⚠️  字段 "creatorId" 已存在！');
      console.log('字段信息:');
      console.log(`  - 字段名: ${columns[0].Field}`);
      console.log(`  - 类型: ${columns[0].Type}`);
      console.log(`  - 允许NULL: ${columns[0].Null}`);
      console.log(`  - 默认值: ${columns[0].Default}`);
      console.log('\n无需重复创建。\n');
      await sequelize.close();
      process.exit(0);
    }

    // 添加 creatorId 字段
    console.log('\n开始添加 creatorId 字段...');
    await sequelize.query(`
      ALTER TABLE labs
      ADD COLUMN creatorId INT NULL COMMENT '创建者ID(教师)'
      AFTER rating
    `);

    console.log('✅ 字段添加成功！\n');

    // 添加外键约束(可选,如果需要保证数据完整性)
    console.log('开始添加外键约束...');
    try {
      await sequelize.query(`
        ALTER TABLE labs
        ADD CONSTRAINT fk_labs_creator
        FOREIGN KEY (creatorId) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
      `);
      console.log('✅ 外键约束添加成功！\n');
    } catch (fkError) {
      if (fkError.original && fkError.original.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  外键约束已存在，跳过创建。\n');
      } else {
        console.log('⚠️  外键约束添加失败(可忽略):', fkError.message);
        console.log('   如需外键约束,请手动添加。\n');
      }
    }

    // 验证字段创建
    const [newColumns] = await sequelize.query(`
      SHOW COLUMNS FROM labs LIKE 'creatorId'
    `);

    console.log('═══════════════════════════════════════');
    console.log('字段验证:');
    console.log(`  字段名: ${newColumns[0].Field}`);
    console.log(`  类型: ${newColumns[0].Type}`);
    console.log(`  允许NULL: ${newColumns[0].Null}`);
    console.log(`  默认值: ${newColumns[0].Default || 'NULL'}`);
    console.log(`  注释: 创建者ID(教师)`);
    console.log('═══════════════════════════════════════\n');
    console.log('✅ 数据库结构更新完成！\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 添加字段失败:', error.message);

    if (error.name === 'SequelizeConnectionError') {
      console.error('\n数据库连接失败，请检查:');
      console.error('  1. MySQL 服务是否启动');
      console.error('  2. .env 文件中的数据库配置是否正确');
      console.error('  3. 数据库是否已创建\n');
    } else if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      console.error('\nlabs 表不存在，请先运行应用以创建表结构。\n');
    } else if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.error('\ncreatorId 字段已存在。\n');
    }

    await sequelize.close();
    process.exit(1);
  }
}

// 执行字段添加
addLabCreatorId().catch(err => {
  console.error('字段添加脚本执行失败:', err);
  process.exit(1);
});
