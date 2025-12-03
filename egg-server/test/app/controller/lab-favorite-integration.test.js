'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/lab-favorite-integration.test.js', () => {
  let user;
  let lab1, lab2;

  before(async () => {
    const ctx = app.mockContext();

    // Create test user
    user = await ctx.model.User.create({
      username: 'integration_test_' + Date.now(),
      password: 'password123',
      email: 'integration_' + Date.now() + '@example.com',
      role: 'student',
    });

    // Create test labs
    lab1 = await ctx.model.Lab.create({
      name: 'Integration Test Lab 1',
      location: 'Building A',
      capacity: 30,
      status: 1,
      department: 'Computer Science',
      tags: ['programming'],
    });

    lab2 = await ctx.model.Lab.create({
      name: 'Integration Test Lab 2',
      location: 'Building B',
      capacity: 25,
      status: 1,
      department: 'Physics',
      tags: ['physics'],
    });

    // Create favorite for lab1
    await ctx.model.Favorite.create({
      userId: user.id,
      labId: lab1.id,
    });
  });

  after(async () => {
    const ctx = app.mockContext();
    // Cleanup
    await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
    await ctx.model.Lab.destroy({ where: { id: [lab1.id, lab2.id] }, force: true });
    await ctx.model.User.destroy({ where: { id: user.id }, force: true });
  });

  describe('GET /api/labs', () => {
    it('should return labs with isFavorite=false for unauthenticated users', async () => {
      const result = await app.httpRequest()
        .get('/api/labs')
        .expect(200);

      assert(result.body.code === 200);
      assert(result.body.data && result.body.data.list);
      assert(Array.isArray(result.body.data.list));

      // Find our test labs
      const testLab1 = result.body.data.list.find(l => l.id === lab1.id);
      const testLab2 = result.body.data.list.find(l => l.id === lab2.id);

      if (testLab1) {
        assert(testLab1.isFavorite === false, 'Unauthenticated user should see isFavorite=false');
      }
      if (testLab2) {
        assert(testLab2.isFavorite === false, 'Unauthenticated user should see isFavorite=false');
      }
    });

    it('should return labs with correct isFavorite status for authenticated users', async () => {
      // Generate JWT token for the test user
      const token = app.jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        app.config.jwt.secret
      );

      const result = await app.httpRequest()
        .get('/api/labs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert(result.body.code === 200);
      assert(result.body.data && result.body.data.list);
      assert(Array.isArray(result.body.data.list));

      // Find our test labs
      const testLab1 = result.body.data.list.find(l => l.id === lab1.id);
      const testLab2 = result.body.data.list.find(l => l.id === lab2.id);

      assert(testLab1, 'Lab 1 should be in the results');
      assert(testLab2, 'Lab 2 should be in the results');
      assert(testLab1.isFavorite === true, 'Lab 1 should be favorited');
      assert(testLab2.isFavorite === false, 'Lab 2 should not be favorited');
    });
  });

  describe('GET /api/labs/:id', () => {
    it('should return lab detail with isFavorite=false for unauthenticated users', async () => {
      const result = await app.httpRequest()
        .get(`/api/labs/${lab1.id}`)
        .expect(200);

      assert(result.body.code === 200);
      assert(result.body.data.id === lab1.id);
      assert(result.body.data.isFavorite === false, 'Unauthenticated user should see isFavorite=false');
    });

    it('should return lab detail with correct isFavorite status for authenticated users', async () => {
      // Generate JWT token for the test user
      const token = app.jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        app.config.jwt.secret
      );

      // Test favorited lab
      const result1 = await app.httpRequest()
        .get(`/api/labs/${lab1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert(result1.body.code === 200);
      assert(result1.body.data.id === lab1.id);
      assert(result1.body.data.isFavorite === true, 'Lab 1 should be favorited');

      // Test non-favorited lab
      const result2 = await app.httpRequest()
        .get(`/api/labs/${lab2.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert(result2.body.code === 200);
      assert(result2.body.data.id === lab2.id);
      assert(result2.body.data.isFavorite === false, 'Lab 2 should not be favorited');
    });
  });

  describe('GET /api/labs/popular', () => {
    it('should return popular labs with isFavorite=false for unauthenticated users', async () => {
      const result = await app.httpRequest()
        .get('/api/labs/popular')
        .expect(200);

      assert(result.body.code === 200);
      assert(result.body.data && result.body.data.list);
      assert(Array.isArray(result.body.data.list));

      // All labs should have isFavorite=false for unauthenticated users
      result.body.data.list.forEach(lab => {
        assert(lab.isFavorite === false, 'Unauthenticated user should see isFavorite=false');
      });
    });

    it('should return popular labs with correct isFavorite status for authenticated users', async () => {
      // Generate JWT token for the test user
      const token = app.jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        app.config.jwt.secret
      );

      const result = await app.httpRequest()
        .get('/api/labs/popular')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      assert(result.body.code === 200);
      assert(result.body.data && result.body.data.list);
      assert(Array.isArray(result.body.data.list));

      // Find our test labs
      const testLab1 = result.body.data.list.find(l => l.id === lab1.id);
      const testLab2 = result.body.data.list.find(l => l.id === lab2.id);

      if (testLab1) {
        assert(testLab1.isFavorite === true, 'Lab 1 should be favorited');
      }
      if (testLab2) {
        assert(testLab2.isFavorite === false, 'Lab 2 should not be favorited');
      }
    });
  });
});
