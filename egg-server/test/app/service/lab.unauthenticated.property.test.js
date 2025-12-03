'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const fc = require('fast-check');

/**
 * Feature: lab-favorite-feature, Property 4: 未登录用户收藏状态
 * 验证: 需求 3.5
 * 
 * 属性: 对于任何未登录的用户请求，所有实验室的 isFavorite 字段应该为 false
 */
describe('Property Test: attachFavoriteStatus - Unauthenticated User Favorite Status', () => {
  let ctx;

  beforeEach(() => {
    ctx = app.mockContext();
  });

  it('should return isFavorite=false for all labs when userId is null', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of labs (1-10)
        fc.integer({ min: 1, max: 10 }),
        async (labCount) => {
          // Create labs
          const createdLabs = [];
          const labId = Math.random().toString(36).substring(2, 8);
          for (let i = 0; i < labCount; i++) {
            const lab = await ctx.model.Lab.create({
              name: `UnauthLab${i}_${labId}`,
              location: `Building ${i}`,
              capacity: 20 + i,
              status: 1,
              department: `Department ${i}`,
              tags: [`tag${i}`],
            });
            createdLabs.push(lab);
          }

          // Get labs from database
          const labs = await ctx.model.Lab.findAll({
            where: {
              id: createdLabs.map(l => l.id),
            },
          });

          // Attach favorite status with null userId (unauthenticated user)
          const result = await ctx.service.lab.attachFavoriteStatus(labs, null);

          // Verify: all labs should have isFavorite=false
          const allNotFavorited = result.every(lab => lab.dataValues.isFavorite === false);

          // Cleanup
          await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });

          assert(allNotFavorited, 'All labs should have isFavorite=false when userId is null');
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  it('should return isFavorite=false for all labs when userId is undefined', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of labs (1-10)
        fc.integer({ min: 1, max: 10 }),
        async (labCount) => {
          // Create labs
          const createdLabs = [];
          const labId = Math.random().toString(36).substring(2, 8);
          for (let i = 0; i < labCount; i++) {
            const lab = await ctx.model.Lab.create({
              name: `UndefLab${i}_${labId}`,
              location: `Building ${i}`,
              capacity: 20 + i,
              status: 1,
              department: `Department ${i}`,
              tags: [`tag${i}`],
            });
            createdLabs.push(lab);
          }

          // Get labs from database
          const labs = await ctx.model.Lab.findAll({
            where: {
              id: createdLabs.map(l => l.id),
            },
          });

          // Attach favorite status with undefined userId (unauthenticated user)
          const result = await ctx.service.lab.attachFavoriteStatus(labs, undefined);

          // Verify: all labs should have isFavorite=false
          const allNotFavorited = result.every(lab => lab.dataValues.isFavorite === false);

          // Cleanup
          await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });

          assert(allNotFavorited, 'All labs should have isFavorite=false when userId is undefined');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isFavorite=false even when favorite records exist for other users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of labs (1-5)
        fc.integer({ min: 1, max: 5 }),
        async (labCount) => {
          // Create a test user who has favorites
          const uniqueId = Math.random().toString(36).substring(2, 10);
          const user = await ctx.model.User.create({
            username: 'other_' + uniqueId,
            password: 'password123',
            email: 'other_' + uniqueId + '@test.com',
            role: 'student',
          });

          // Create labs and favorite them for the test user
          const createdLabs = [];
          const labId = Math.random().toString(36).substring(2, 8);
          for (let i = 0; i < labCount; i++) {
            const lab = await ctx.model.Lab.create({
              name: `OtherUserLab${i}_${labId}`,
              location: `Building ${i}`,
              capacity: 20 + i,
              status: 1,
              department: `Department ${i}`,
              tags: [`tag${i}`],
            });
            createdLabs.push(lab);

            // Create favorite for the test user
            await ctx.model.Favorite.create({
              userId: user.id,
              labId: lab.id,
            });
          }

          // Get labs from database
          const labs = await ctx.model.Lab.findAll({
            where: {
              id: createdLabs.map(l => l.id),
            },
          });

          // Attach favorite status with null userId (unauthenticated user)
          const result = await ctx.service.lab.attachFavoriteStatus(labs, null);

          // Verify: all labs should have isFavorite=false for unauthenticated user
          // even though they are favorited by another user
          const allNotFavorited = result.every(lab => lab.dataValues.isFavorite === false);

          // Cleanup
          await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
          await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });
          await ctx.model.User.destroy({ where: { id: user.id }, force: true });

          assert(
            allNotFavorited,
            'All labs should have isFavorite=false for unauthenticated user, regardless of other users favorites'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
