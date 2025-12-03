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
 * 为 favorites 表添加复合索引以优化查询性能
 * 使用方式: node scripts/add-favorite-index.js
 */

async function addFavoriteIndex() {
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

    // 检查索引是否已存在
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM favorites WHERE Key_name = 'idx_userId_labId'
    `);

    if (indexes && indexes.length > 0) {
      console.log('\n⚠️  索引 "idx_userId_labId" 已存在！');
      console.log('索引信息:');
      indexes.forEach(idx => {
        console.log(`  - 列名: ${idx.Column_name}, 序列: ${idx.Seq_in_index}`);
      });
      console.log('\n无需重复创建。\n');
      await sequelize.close();
      process.exit(0);
    }

    // 创建复合索引
    console.log('\n开始创建复合索引...');
    await sequelize.query(`
      CREATE INDEX idx_userId_labId ON favorites (userId, labId)
    `);

    console.log('✅ 复合索引创建成功！\n');

    // 验证索引创建
    const [newIndexes] = await sequelize.query(`
      SHOW INDEX FROM favorites WHERE Key_name = 'idx_userId_labId'
    `);

    console.log('═══════════════════════════════════════');
    console.log('索引验证:');
    console.log(`  索引名称: idx_userId_labId`);
    console.log(`  表名: favorites`);
    console.log('  索引列:');
    newIndexes.forEach(idx => {
      console.log(`    - ${idx.Column_name} (序列: ${idx.Seq_in_index})`);
    });
    console.log('═══════════════════════════════════════\n');
    console.log('✅ 索引优化完成！查询性能已提升。\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 创建索引失败:', error.message);

    if (error.name === 'SequelizeConnectionError') {
      console.error('\n数据库连接失败，请检查:');
      console.error('  1. MySQL 服务是否启动');
      console.error('  2. .env 文件中的数据库配置是否正确');
      console.error('  3. 数据库是否已创建\n');
    } else if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      console.error('\nfavorites 表不存在，请先运行应用以创建表结构。\n');
    }

    await sequelize.close();
    process.exit(1);
  }
}

// 执行索引创建
addFavoriteIndex().catch(err => {
  console.error('索引创建脚本执行失败:', err);
  process.exit(1);
});
