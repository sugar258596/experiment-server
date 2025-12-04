# 动态功能快速启动指南

## 功能概述

将"新闻公告"改造为"动态"功能，新增：
- ✅ 只有老师和管理员可以发布动态
- ✅ 学生和老师都可以点赞和收藏动态
- ✅ 个人页面展示点赞和收藏的动态

## 启动步骤

### 1. 启动后端服务

```bash
cd egg-server
npm run dev
```

服务器启动后会自动创建以下新表：
- `news_likes` - 点赞记录表
- `news_favorites` - 收藏记录表

### 2. 启动前端服务

```bash
cd web
npm run dev
```

## 功能测试

### 测试发布权限

1. **学生账号登录**
   - 进入动态页面 `/news`
   - 应该看不到"发布动态"按钮

2. **老师账号登录**
   - 进入动态页面 `/news`
   - 应该看到"发布动态"按钮
   - 点击可以发布新动态

3. **管理员账号登录**
   - 进入动态页面 `/news`
   - 应该看到"发布动态"按钮
   - 点击可以发布新动态

### 测试点赞功能

1. 登录任意账号（学生/老师）
2. 进入动态列表或详情页
3. 点击"点赞"按钮
   - 按钮状态变为"已点赞"
   - 点赞数 +1
4. 再次点击"点赞"按钮
   - 按钮状态变为"点赞"
   - 点赞数 -1

### 测试收藏功能

1. 登录任意账号（学生/老师）
2. 进入动态列表或详情页
3. 点击"收藏"按钮
   - 按钮状态变为"已收藏"
   - 收藏数 +1
4. 再次点击"收藏"按钮
   - 按钮状态变为"收藏"
   - 收藏数 -1

### 测试个人中心

1. 登录任意账号
2. 进入个人中心 `/profile`
3. 切换到"点赞的动态"标签页
   - 显示所有点赞过的动态
   - 显示点赞时间
4. 切换到"收藏的动态"标签页
   - 显示所有收藏的动态
   - 显示收藏时间
5. 点击任意动态卡片
   - 跳转到动态详情页

## API 端点

### 动态管理
- `GET /api/news` - 获取动态列表
- `GET /api/news/:id` - 获取动态详情
- `POST /api/news` - 发布动态（老师/管理员）
- `PUT /api/news/:id` - 更新动态（作者/管理员）
- `DELETE /api/news/:id` - 删除动态（作者/管理员）

### 点赞和收藏
- `POST /api/news/:id/like` - 切换点赞状态
- `POST /api/news/:id/favorite` - 切换收藏状态
- `GET /api/news/my/likes` - 获取我点赞的动态
- `GET /api/news/my/favorites` - 获取我收藏的动态

## 数据库表

### news_likes
```
id, userId, newsId, createdAt, deletedAt
唯一索引: (userId, newsId)
```

### news_favorites
```
id, userId, newsId, createdAt, deletedAt
唯一索引: (userId, newsId)
```

## 常见问题

### Q: 数据库表没有自动创建？
A: 检查 `egg-server/app.js` 中是否有 `await app.model.sync()`

### Q: 学生可以发布动态？
A: 检查后端权限中间件配置，确保路由使用了 `roles('TEACHER', 'ADMIN', 'SUPER_ADMIN')`

### Q: 点赞或收藏没有反应？
A: 检查浏览器控制台是否有错误，确认用户已登录

### Q: 个人中心看不到点赞和收藏标签页？
A: 检查组件是否正确导入，确认标签页代码已添加

## 文件清单

### 后端新增/修改
- ✅ `egg-server/app/model/newsLike.js` - 新增
- ✅ `egg-server/app/model/newsFavorite.js` - 新增
- ✅ `egg-server/app/model/user.js` - 修改（添加关联）
- ✅ `egg-server/app/model/news.js` - 修改（添加关联）
- ✅ `egg-server/app/service/news.js` - 修改（添加功能）
- ✅ `egg-server/app/controller/news.js` - 修改（添加接口）
- ✅ `egg-server/app/router/news.js` - 修改（添加路由）

### 前端新增/修改
- ✅ `web/src/views/news/index.vue` - 修改（添加点赞收藏）
- ✅ `web/src/views/news/detail.vue` - 修改（添加点赞收藏）
- ✅ `web/src/views/profile/components/NewsLikesTab.vue` - 新增
- ✅ `web/src/views/profile/components/NewsFavoritesTab.vue` - 新增
- ✅ `web/src/views/profile/components/StudentProfile.vue` - 修改（添加标签页）
- ✅ `web/src/views/profile/components/TeacherProfile.vue` - 修改（添加标签页）

## 技术栈

- 后端：Egg.js + Sequelize + MySQL
- 前端：Vue 3 + Element Plus + Tailwind CSS
- 认证：JWT

## 支持

如有问题，请查看：
- `DYNAMIC_FEATURE.md` - 详细功能说明
- `egg-server/DATABASE_MIGRATION.md` - 数据库迁移说明
- `IMPLEMENTATION_SUMMARY.md` - 实现总结
