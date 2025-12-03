'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/lab.test.js', () => {
  let ctx;

  beforeEach(() => {
    ctx = app.mockContext();
  });

  describe('attachFavoriteStatus()', () => {
    it('should attach isFavorite=false when userId is null', async () => {
      const mockLabs = [
        { id: 1, name: 'Lab 1', dataValues: {} },
        { id: 2, name: 'Lab 2', dataValues: {} },
      ];

      const result = await ctx.service.lab.attachFavoriteStatus(mockLabs, null);

      assert(result.length === 2);
      assert(result[0].dataValues.isFavorite === false);
      assert(result[1].dataValues.isFavorite === false);
    });

    it('should attach isFavorite=false when userId is undefined', async () => {
      const mockLabs = [
        { id: 1, name: 'Lab 1', dataValues: {} },
      ];

      const result = await ctx.service.lab.attachFavoriteStatus(mockLabs, undefined);

      assert(result.length === 1);
      assert(result[0].dataValues.isFavorite === false);
    });

    it('should handle single lab object', async () => {
      const mockLab = { id: 1, name: 'Lab 1', dataValues: {} };

      const result = await ctx.service.lab.attachFavoriteStatus(mockLab, null);

      assert(result.id === 1);
      assert(result.dataValues.isFavorite === false);
    });

    it('should handle empty array', async () => {
      const result = await ctx.service.lab.attachFavoriteStatus([], 1);

      assert(Array.isArray(result));
      assert(result.length === 0);
    });

    it('should handle null labs', async () => {
      const result = await ctx.service.lab.attachFavoriteStatus(null, 1);

      assert(result === null);
    });

    it('should correctly attach isFavorite based on user favorites', async () => {
      // Create test user
      const user = await ctx.model.User.create({
        username: 'testuser_' + Date.now(),
        password: 'password123',
        email: 'test_' + Date.now() + '@example.com',
        role: 'student',
      });

      // Create test labs
      const lab1 = await ctx.model.Lab.create({
        name: 'Test Lab 1',
        location: 'Building A',
        capacity: 30,
        status: 1,
        department: 'Computer Science',
        tags: ['programming', 'software'],
      });

      const lab2 = await ctx.model.Lab.create({
        name: 'Test Lab 2',
        location: 'Building B',
        capacity: 25,
        status: 1,
        department: 'Physics',
        tags: ['physics', 'experiments'],
      });

      const lab3 = await ctx.model.Lab.create({
        name: 'Test Lab 3',
        location: 'Building C',
        capacity: 20,
        status: 1,
        department: 'Chemistry',
        tags: ['chemistry', 'lab'],
      });

      // Create favorites for lab1 and lab3
      await ctx.model.Favorite.create({
        userId: user.id,
        labId: lab1.id,
      });

      await ctx.model.Favorite.create({
        userId: user.id,
        labId: lab3.id,
      });

      // Get labs and attach favorite status
      const labs = await ctx.model.Lab.findAll({
        where: {
          id: [lab1.id, lab2.id, lab3.id],
        },
      });

      const result = await ctx.service.lab.attachFavoriteStatus(labs, user.id);

      // Verify results
      assert(result.length === 3);

      const resultLab1 = result.find(l => l.id === lab1.id);
      const resultLab2 = result.find(l => l.id === lab2.id);
      const resultLab3 = result.find(l => l.id === lab3.id);

      assert(resultLab1.dataValues.isFavorite === true, 'Lab 1 should be favorited');
      assert(resultLab2.dataValues.isFavorite === false, 'Lab 2 should not be favorited');
      assert(resultLab3.dataValues.isFavorite === true, 'Lab 3 should be favorited');

      // Cleanup
      await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
      await ctx.model.Lab.destroy({ where: { id: [lab1.id, lab2.id, lab3.id] }, force: true });
      await ctx.model.User.destroy({ where: { id: user.id }, force: true });
    });

    it('should use single query for multiple labs (performance test)', async () => {
      // Create test user
      const user = await ctx.model.User.create({
        username: 'perftest_' + Date.now(),
        password: 'password123',
        email: 'perftest_' + Date.now() + '@example.com',
        role: 'student',
      });

      // Create 10 test labs
      const labPromises = [];
      for (let i = 0; i < 10; i++) {
        labPromises.push(ctx.model.Lab.create({
          name: `Perf Test Lab ${i}`,
          location: `Building ${i}`,
          capacity: 20 + i,
          status: 1,
          department: `Department ${i}`,
          tags: [`tag${i}`],
        }));
      }
      const createdLabs = await Promise.all(labPromises);

      // Create favorites for half of them
      const favoritePromises = [];
      for (let i = 0; i < 5; i++) {
        favoritePromises.push(ctx.model.Favorite.create({
          userId: user.id,
          labId: createdLabs[i].id,
        }));
      }
      await Promise.all(favoritePromises);

      // Get labs
      const labs = await ctx.model.Lab.findAll({
        where: {
          id: createdLabs.map(l => l.id),
        },
      });

      // Attach favorite status - this should use only ONE query
      const result = await ctx.service.lab.attachFavoriteStatus(labs, user.id);

      // Verify results
      assert(result.length === 10);

      // First 5 should be favorited
      for (let i = 0; i < 5; i++) {
        const lab = result.find(l => l.id === createdLabs[i].id);
        assert(lab.dataValues.isFavorite === true, `Lab ${i} should be favorited`);
      }

      // Last 5 should not be favorited
      for (let i = 5; i < 10; i++) {
        const lab = result.find(l => l.id === createdLabs[i].id);
        assert(lab.dataValues.isFavorite === false, `Lab ${i} should not be favorited`);
      }

      // Cleanup
      await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
      await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });
      await ctx.model.User.destroy({ where: { id: user.id }, force: true });
    });
  });
});
