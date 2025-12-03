'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/cross-page-consistency.test.js', () => {
  let user;
  let testLab;
  let token;

  before(async () => {
    const ctx = app.mockContext();

    // Create test user
    user = await ctx.model.User.create({
      username: 'cross_page_test_' + Date.now(),
      password: 'password123',
      email: 'cross_page_' + Date.now() + '@example.com',
      role: 'student',
    });

    // Create test lab
    testLab = await ctx.model.Lab.create({
      name: 'Cross Page Test Lab',
      location: 'Building C',
      capacity: 20,
      status: 1,
      department: 'Engineering',
      tags: ['testing'],
    });

    // Generate JWT token for the test user
    token = app.jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      app.config.jwt.secret
    );
  });

  afterEach(async () => {
    const ctx = app.mockContext();
    // Clean up any favorites created during tests
    await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
  });

  after(async () => {
    const ctx = app.mockContext();
    // Final cleanup
    await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
    await ctx.model.Lab.destroy({ where: { id: testLab.id }, force: true });
    await ctx.model.User.destroy({ where: { id: user.id }, force: true });
  });

  it('should maintain consistent favorite state across all pages', async () => {
    // Step 1: Verify initial state - lab should not be favorited
    const initialListResult = await app.httpRequest()
      .get('/api/labs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const initialLab = initialListResult.body.data.list.find(l => l.id === testLab.id);
    assert(initialLab, 'Lab should exist in list');
    assert(initialLab.isFavorite === false, 'Lab should not be favorited initially');

    // Step 2: Favorite the lab (simulating action from list page)
    const toggleResult1 = await app.httpRequest()
      .post(`/api/favorites/appointments/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(toggleResult1.body.code === 200, 'Toggle should succeed');
    assert(toggleResult1.body.message === '收藏成功', 'Should show success message');

    // Step 3: Navigate to detail page - verify isFavorite is true
    const detailResult1 = await app.httpRequest()
      .get(`/api/labs/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(detailResult1.body.code === 200, 'Detail request should succeed');
    assert(detailResult1.body.data.id === testLab.id, 'Should return correct lab');
    assert(detailResult1.body.data.isFavorite === true, 'Lab should show as favorited in detail page');

    // Step 4: Navigate to favorites list - verify lab appears in the list
    const favoritesResult1 = await app.httpRequest()
      .get('/api/favorites/appointments')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(favoritesResult1.body.code === 200, 'Favorites request should succeed');
    assert(favoritesResult1.body.data.data, 'Should have favorites data');

    const favoritedLab = favoritesResult1.body.data.data.find(f => f.labId === testLab.id);
    assert(favoritedLab, 'Lab should appear in favorites list');
    assert(favoritedLab.lab.id === testLab.id, 'Favorite should contain correct lab data');

    // Step 5: Unfavorite from detail page
    const toggleResult2 = await app.httpRequest()
      .post(`/api/favorites/appointments/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(toggleResult2.body.code === 200, 'Toggle should succeed');
    assert(toggleResult2.body.data.isFavorited === false, 'Lab should be unfavorited');
    assert(toggleResult2.body.message === '已取消收藏', 'Should show unfavorite message');

    // Step 6: Return to list page - verify isFavorite is false
    const listResult2 = await app.httpRequest()
      .get('/api/labs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const unfavoritedLab = listResult2.body.data.list.find(l => l.id === testLab.id);
    assert(unfavoritedLab, 'Lab should still exist in list');
    assert(unfavoritedLab.isFavorite === false, 'Lab should show as not favorited in list page');

    // Step 7: Return to favorites list - verify lab is removed
    const favoritesResult2 = await app.httpRequest()
      .get('/api/favorites/appointments')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(favoritesResult2.body.code === 200, 'Favorites request should succeed');

    const removedLab = favoritesResult2.body.data.data.find(f => f.labId === testLab.id);
    assert(!removedLab, 'Lab should be removed from favorites list');
  });

  it('should maintain consistency when favoriting from detail page', async () => {
    // Start from detail page
    const detailResult1 = await app.httpRequest()
      .get(`/api/labs/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(detailResult1.body.data.isFavorite === false, 'Lab should not be favorited initially');

    // Favorite from detail page
    const toggleResult = await app.httpRequest()
      .post(`/api/favorites/appointments/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(toggleResult.body.code === 200, 'Toggle should succeed');
    assert(toggleResult.body.message === '收藏成功', 'Should show success message');

    // Check list page
    const listResult = await app.httpRequest()
      .get('/api/labs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const labInList = listResult.body.data.list.find(l => l.id === testLab.id);
    assert(labInList.isFavorite === true, 'Lab should show as favorited in list page');

    // Check favorites page
    const favoritesResult = await app.httpRequest()
      .get('/api/favorites/appointments')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const favoritedLab = favoritesResult.body.data.data.find(f => f.labId === testLab.id);
    assert(favoritedLab, 'Lab should appear in favorites list');

    // Cleanup - unfavorite
    await app.httpRequest()
      .post(`/api/favorites/appointments/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('should maintain consistency when unfavoriting from favorites list', async () => {
    // First, favorite the lab
    await app.httpRequest()
      .post(`/api/favorites/appointments/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify it's in favorites list
    const favoritesResult1 = await app.httpRequest()
      .get('/api/favorites/appointments')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const favoritedLab = favoritesResult1.body.data.data.find(f => f.labId === testLab.id);
    assert(favoritedLab, 'Lab should be in favorites list');

    // Unfavorite (simulating action from favorites page)
    const toggleResult = await app.httpRequest()
      .post(`/api/favorites/appointments/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(toggleResult.body.code === 200, 'Toggle should succeed');
    assert(toggleResult.body.data.isFavorited === false, 'Lab should be unfavorited');
    assert(toggleResult.body.message === '已取消收藏', 'Should show unfavorite message');

    // Check list page
    const listResult = await app.httpRequest()
      .get('/api/labs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const labInList = listResult.body.data.list.find(l => l.id === testLab.id);
    assert(labInList.isFavorite === false, 'Lab should show as not favorited in list page');

    // Check detail page
    const detailResult = await app.httpRequest()
      .get(`/api/labs/${testLab.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert(detailResult.body.data.isFavorite === false, 'Lab should show as not favorited in detail page');

    // Check favorites list
    const favoritesResult2 = await app.httpRequest()
      .get('/api/favorites/appointments')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const removedLab = favoritesResult2.body.data.data.find(f => f.labId === testLab.id);
    assert(!removedLab, 'Lab should be removed from favorites list');
  });
});
