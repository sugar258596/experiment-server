'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const fc = require('fast-check');

/**
 * Feature: lab-favorite-feature, Property 3: 收藏数据正确性
 * 验证: 需求 3.1, 3.2, 3.3, 3.4
 * 
 * 属性: 对于任何用户和实验室，系统返回的 isFavorite 字段应该准确反映数据库中的收藏记录
 * （存在收藏记录时为true，不存在时为false）
 */
describe('Property Test: attachFavoriteStatus - Favorite Data Correctness', () => {
  let ctx;

  beforeEach(() => {
    ctx = app.mockContext();
  });

  it('should accurately reflect database favorite records in isFavorite field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of labs (1-10)
        fc.integer({ min: 1, max: 10 }),
        // Generate random favorite indices (which labs should be favorited)
        fc.array(fc.integer({ min: 0, max: 9 }), { maxLength: 10 }),
        async (labCount, favoriteIndices) => {
          // Create test user with short unique identifier
          const uniqueId = Math.random().toString(36).substring(2, 10);
          const user = await ctx.model.User.create({
            username: 'pt_' + uniqueId,
            password: 'password123',
            email: 'pt_' + uniqueId + '@test.com',
            role: 'student',
          });

          // Create labs
          const createdLabs = [];
          const labId = Math.random().toString(36).substring(2, 8);
          for (let i = 0; i < labCount; i++) {
            const lab = await ctx.model.Lab.create({
              name: `PTLab${i}_${labId}`,
              location: `Bldg ${i}`,
              capacity: 20 + i,
              status: 1,
              department: `Dept ${i}`,
              tags: [`tag${i}`],
            });
            createdLabs.push(lab);
          }

          // Create favorites based on favoriteIndices
          // Use Set to avoid duplicates
          const uniqueFavoriteIndices = [...new Set(favoriteIndices.filter(idx => idx < labCount))];
          const favoritedLabIds = new Set();

          for (const idx of uniqueFavoriteIndices) {
            await ctx.model.Favorite.create({
              userId: user.id,
              labId: createdLabs[idx].id,
            });
            favoritedLabIds.add(createdLabs[idx].id);
          }

          // Get labs from database
          const labs = await ctx.model.Lab.findAll({
            where: {
              id: createdLabs.map(l => l.id),
            },
          });

          // Attach favorite status
          const result = await ctx.service.lab.attachFavoriteStatus(labs, user.id);

          // Verify: isFavorite should match database records
          let allCorrect = true;
          for (const lab of result) {
            const expectedIsFavorite = favoritedLabIds.has(lab.id);
            const actualIsFavorite = lab.dataValues.isFavorite;

            if (expectedIsFavorite !== actualIsFavorite) {
              allCorrect = false;
              console.error(`Lab ${lab.id}: expected isFavorite=${expectedIsFavorite}, got ${actualIsFavorite}`);
            }
          }

          // Cleanup
          await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
          await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });
          await ctx.model.User.destroy({ where: { id: user.id }, force: true });

          assert(allCorrect, 'All labs should have correct isFavorite status matching database records');
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  it('should return isFavorite=true when favorite record exists in database', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of labs to favorite (1-5)
        fc.integer({ min: 1, max: 5 }),
        async (favoriteCount) => {
          // Create test user with short unique identifier
          const uniqueId = Math.random().toString(36).substring(2, 10);
          const user = await ctx.model.User.create({
            username: 'pte_' + uniqueId,
            password: 'password123',
            email: 'pte_' + uniqueId + '@test.com',
            role: 'student',
          });

          // Create labs
          const createdLabs = [];
          const labId = Math.random().toString(36).substring(2, 8);
          for (let i = 0; i < favoriteCount; i++) {
            const lab = await ctx.model.Lab.create({
              name: `ExLab${i}_${labId}`,
              location: `Bldg ${i}`,
              capacity: 20 + i,
              status: 1,
              department: `Dept ${i}`,
              tags: [`tag${i}`],
            });
            createdLabs.push(lab);

            // Create favorite for this lab
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

          // Attach favorite status
          const result = await ctx.service.lab.attachFavoriteStatus(labs, user.id);

          // Verify: all labs should have isFavorite=true
          const allFavorited = result.every(lab => lab.dataValues.isFavorite === true);

          // Cleanup
          await ctx.model.Favorite.destroy({ where: { userId: user.id }, force: true });
          await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });
          await ctx.model.User.destroy({ where: { id: user.id }, force: true });

          assert(allFavorited, 'All labs with favorite records should have isFavorite=true');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return isFavorite=false when no favorite record exists in database', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of labs (1-5)
        fc.integer({ min: 1, max: 5 }),
        async (labCount) => {
          // Create test user with short unique identifier
          const uniqueId = Math.random().toString(36).substring(2, 10);
          const user = await ctx.model.User.create({
            username: 'ptn_' + uniqueId,
            password: 'password123',
            email: 'ptn_' + uniqueId + '@test.com',
            role: 'student',
          });

          // Create labs WITHOUT creating favorites
          const createdLabs = [];
          const labId = Math.random().toString(36).substring(2, 8);
          for (let i = 0; i < labCount; i++) {
            const lab = await ctx.model.Lab.create({
              name: `NoFavLab${i}_${labId}`,
              location: `Bldg ${i}`,
              capacity: 20 + i,
              status: 1,
              department: `Dept ${i}`,
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

          // Attach favorite status
          const result = await ctx.service.lab.attachFavoriteStatus(labs, user.id);

          // Verify: all labs should have isFavorite=false
          const allNotFavorited = result.every(lab => lab.dataValues.isFavorite === false);

          // Cleanup
          await ctx.model.Lab.destroy({ where: { id: createdLabs.map(l => l.id) }, force: true });
          await ctx.model.User.destroy({ where: { id: user.id }, force: true });

          assert(allNotFavorited, 'All labs without favorite records should have isFavorite=false');
        }
      ),
      { numRuns: 100 }
    );
  });
});
