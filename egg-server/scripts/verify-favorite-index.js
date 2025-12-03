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
 * 验证 favorites 表的索引配置
 * 使用方式: node scripts/verify-favorite-index.js
 */

async function verifyFavoriteIndex() {
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

  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！\n');

    // 获取 favorites 表的所有索引
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM favorites
    `);

    console.log('═══════════════════════════════════════');
    console.log('favorites 表索引信息:');
    console.log('═══════════════════════════════════════\n');

    // 按索引名称分组
    const indexGroups = {};
    indexes.forEach(idx => {
      if (!indexGroups[idx.Key_name]) {
        indexGroups[idx.Key_name] = [];
      }
      indexGroups[idx.Key_name].push(idx);
    });

    // 显示每个索引的详细信息
    Object.keys(indexGroups).forEach(indexName => {
      const indexCols = indexGroups[indexName];
      const firstCol = indexCols[0];

      console.log(`索引名称: ${indexName}`);
      console.log(`  类型: ${firstCol.Non_unique === 0 ? 'UNIQUE' : 'INDEX'}`);
      console.log(`  列:`);
      indexCols.forEach(col => {
        console.log(`    - ${col.Column_name} (序列: ${col.Seq_in_index})`);
      });
      console.log('');
    });

    // 检查复合索引是否存在
    const compositeIndex = indexGroups['idx_userId_labId'];
    if (compositeIndex && compositeIndex.length === 2) {
      console.log('✅ 复合索引 idx_userId_labId 配置正确！');
      console.log('   该索引将优化以下查询:');
      console.log('   - 根据 userId 查询用户的所有收藏');
      console.log('   - 根据 userId 和 labId 查询特定收藏记录');
      console.log('   - 批量查询用户对多个实验室的收藏状态\n');
    } else {
      console.log('⚠️  复合索引 idx_userId_labId 不存在或配置不正确！');
      console.log('   请运行: node scripts/add-favorite-index.js\n');
    }

    console.log('═══════════════════════════════════════\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 验证索引失败:', error.message);

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

// 执行验证
verifyFavoriteIndex().catch(err => {
  console.error('验证脚本执行失败:', err);
  process.exit(1);
});
