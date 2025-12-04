# Bug 修复说明

## 问题描述

在访问 `/api/news/my/favorites` 和 `/api/news/my/likes` 接口时，出现以下错误：

```
TypeError: Cannot read properties of undefined (reading 'sub')
at NewsController.getMyFavorites
```

## 问题原因

### 根本原因
JWT 中间件 (`egg-server/app/middleware/jwt-auth.js`) 中的公开路由判断逻辑存在问题：

```javascript
// 原有代码
(path.startsWith('/api/news/') && !path.startsWith('/api/news/pending'))
```

这个条件会将所有 `/api/news/` 开头的 GET 请求都当作公开路由处理，包括：
- `/api/news/my/likes` ✗ 应该需要认证
- `/api/news/my/favorites` ✗ 应该需要认证

对于公开路由，即使没有提供 token，中间件也会放行，导致 `ctx.state.user` 为 `null` 或 `undefined`。

### 次要原因
控制器中没有对 `ctx.state.user` 进行空值检查，直接访问 `ctx.state.user.sub` 导致报错。

## 解决方案

### 1. 修复 JWT 中间件（主要修复）

更新公开路由判断逻辑，排除 `/api/news/my/` 开头的路径：

```javascript
// 修复后的代码
(path.startsWith('/api/news/') && 
  !path.startsWith('/api/news/pending') &&
  !path.startsWith('/api/news/my/'))
```

**文件**: `egg-server/app/middleware/jwt-auth.js`

### 2. 添加用户验证（防御性编程）

在控制器方法中添加用户验证，提供更友好的错误提示：

```javascript
async getMyFavorites() {
  const { ctx } = this;
  if (!ctx.state.user || !ctx.state.user.sub) {
    ctx.throw(401, '请先登录');
  }
  const userId = ctx.state.user.sub;
  // ...
}
```

**文件**: `egg-server/app/controller/news.js`

受影响的方法：
- `like()` - 切换点赞状态
- `favorite()` - 切换收藏状态
- `getMyLikes()` - 获取我点赞的动态
- `getMyFavorites()` - 获取我收藏的动态

## 修复后的行为

### 需要认证的接口
以下接口现在会正确要求用户登录：
- `GET /api/news/my/likes` - 获取我点赞的动态
- `GET /api/news/my/favorites` - 获取我收藏的动态
- `POST /api/news/:id/like` - 切换点赞状态
- `POST /api/news/:id/favorite` - 切换收藏状态

### 公开接口
以下接口保持公开访问（不需要登录）：
- `GET /api/news` - 获取动态列表
- `GET /api/news/:id` - 获取动态详情

对于公开接口，如果用户已登录，会返回点赞和收藏状态；如果未登录，这些状态字段不会出现。

## 测试验证

### 1. 未登录访问需要认证的接口
```bash
curl http://localhost:7001/api/news/my/favorites
# 预期: 401 错误，提示"您没有权限访问此资源，请先登录"
```

### 2. 已登录访问需要认证的接口
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:7001/api/news/my/favorites
# 预期: 200 成功，返回收藏的动态列表
```

### 3. 未登录访问公开接口
```bash
curl http://localhost:7001/api/news
# 预期: 200 成功，返回动态列表（不包含点赞收藏状态）
```

### 4. 已登录访问公开接口
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:7001/api/news
# 预期: 200 成功，返回动态列表（包含点赞收藏状态）
```

## 相关文件

- `egg-server/app/middleware/jwt-auth.js` - JWT 认证中间件
- `egg-server/app/controller/news.js` - 动态控制器
- `egg-server/app/router/news.js` - 动态路由配置

## 预防措施

为了避免类似问题，建议：

1. **明确的路由规则**: 在 JWT 中间件中，对于需要认证的路径使用更精确的匹配规则
2. **防御性编程**: 在控制器中始终验证 `ctx.state.user` 是否存在
3. **单元测试**: 为认证相关的接口添加单元测试
4. **文档说明**: 在路由配置中明确标注哪些接口需要认证

## 前端修复

### 问题
前端组件直接使用 `axios` 而不是配置好的 `request` 实例，导致请求没有自动添加 Authorization token。

### 解决方案
将所有组件中的 `axios` 替换为 `request` 实例：

**修改的文件：**
1. `web/src/views/news/index.vue`
   - 导入：`import { request } from '@/utils/https'`
   - 替换：`axios.post` → `request.post`

2. `web/src/views/news/detail.vue`
   - 导入：`import { request } from '@/utils/https'`
   - 替换：`axios.post` → `request.post`

3. `web/src/views/profile/components/NewsLikesTab.vue`
   - 导入：`import { request } from '@/utils/https'`
   - 替换：`axios.get` → `request.get`

4. `web/src/views/profile/components/NewsFavoritesTab.vue`
   - 导入：`import { request } from '@/utils/https'`
   - 替换：`axios.get` → `request.get`

**注意事项：**
- `request` 实例已配置好拦截器，会自动从 `useAuthStore` 获取 token
- 响应数据已经过拦截器处理，直接返回 `data` 字段
- 错误处理已统一，可以直接使用 `error.message`

## 影响范围

- ✅ 修复了点赞和收藏功能的认证问题
- ✅ 修复了前端请求未携带 token 的问题
- ✅ 不影响现有的公开接口
- ✅ 不影响其他需要认证的接口
- ✅ 统一了前端 HTTP 请求方式
