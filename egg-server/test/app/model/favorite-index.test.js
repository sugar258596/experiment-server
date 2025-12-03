'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/model/favorite-index.test.js', () => {
  let ctx;

  before(async () => {
    ctx = app.mockContext();
  });

  describe('Favorite Model Index Configuration', () => {
    it('should have composite index on userId and labId', async () => {
      // 查询数据库获取 favorites 表的索引信息
      const [indexes] = await app.model.query(`
        SHOW INDEX FROM favorites WHERE Key_name = 'idx_userId_labId'
      `);

      // 验证索引存在
      assert(indexes.length > 0, 'Composite index idx_userId_labId should exist');

      // 验证索引包含两列
      assert.equal(indexes.length, 2, 'Composite index should have 2 columns');

      // 验证第一列是 userId
      const userIdIndex = indexes.find(idx => idx.Seq_in_index === 1);
      assert(userIdIndex, 'First column of index should exist');
      assert.equal(userIdIndex.Column_name, 'userId', 'First column should be userId');

      // 验证第二列是 labId
      const labIdIndex = indexes.find(idx => idx.Seq_in_index === 2);
      assert(labIdIndex, 'Second column of index should exist');
      assert.equal(labIdIndex.Column_name, 'labId', 'Second column should be labId');
    });

    it('should use index for userId queries', async () => {
      // 使用 EXPLAIN 查看查询计划
      const [result] = await app.model.query(`
        EXPLAIN SELECT * FROM favorites WHERE userId = 1
      `);

      // 验证查询使用了索引
      assert(result.length > 0, 'Query plan should be returned');
      const queryPlan = result[0];

      // 索引应该被使用（possible_keys 或 key 包含我们的索引）
      const usesIndex = queryPlan.possible_keys?.includes('idx_userId_labId') ||
        queryPlan.key === 'idx_userId_labId';

      assert(usesIndex, 'Query should use idx_userId_labId index');
    });

    it('should use index for userId and labId queries', async () => {
      // 使用 EXPLAIN 查看查询计划
      const [result] = await app.model.query(`
        EXPLAIN SELECT * FROM favorites WHERE userId = 1 AND labId = 1
      `);

      // 验证查询使用了索引
      assert(result.length > 0, 'Query plan should be returned');
      const queryPlan = result[0];

      // 索引应该被使用
      const usesIndex = queryPlan.possible_keys?.includes('idx_userId_labId') ||
        queryPlan.key === 'idx_userId_labId';

      assert(usesIndex, 'Query should use idx_userId_labId index');
    });
  });
});
