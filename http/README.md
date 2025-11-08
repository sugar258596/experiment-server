# HTTP API 测试文件

本目录包含实验室预约管理系统的所有 HTTP API 测试文件，可用于测试和验证系统的各项功能。

## 📁 文件列表

### 核心测试文件

| 文件名               | 模块 | 描述                   |
| -------------------- | ---- | ---------------------- |
| `README.md`          | -    | 本文件，汇总说明       |
| `API测试使用指南.md` | -    | 详细使用指南和最佳实践 |
| `完整测试流程.http`  | -    | 按场景的完整测试流程   |

### 分模块测试文件

| 文件名              | 模块       | 描述                 | 状态 |
| ------------------- | ---------- | -------------------- | ---- |
| `auth.http`         | 认证模块   | 用户注册、登录       | ✅   |
| `user.http`         | 用户管理   | 用户CRUD、个人信息   | ✅   |
| `lab.http`          | 实验室管理 | 实验室CRUD、搜索     | ✅   |
| `instrument.http`   | 仪器管理   | 仪器CRUD、申请、维修 | ✅   |
| `appointment.http`  | 预约管理   | 预约CRUD、审核       | ✅   |
| `news.http`         | 新闻公告   | 新闻发布、审核、点赞 | ✅   |
| `notification.http` | 通知管理   | 通知列表、已读状态   | ✅   |
| `favorites.http`    | 收藏管理   | 添加/取消收藏、查询  | ✅   |
| `evaluation.http`   | 评价管理   | 提交评价、统计       | ✅   |

## 🚀 快速开始

### 1. 安装 REST Client 插件

推荐使用 VS Code 的 REST Client 插件:

```bash
code --install-extension ms-rest.vscode-restclient
```

### 2. 启动后端服务

```bash
# 安装依赖
pnpm install

# 启动服务
pnpm start:dev
```

### 3. 运行测试

#### 方式一:使用完整测试流程

打开 `完整测试流程.http` 文件，按顺序执行所有测试用例。

#### 方式二:按模块测试

1. 打开对应的模块文件(如 `auth.http`)
2. 修改文件顶部的变量(`@baseUrl`, `@token` 等)
3. 点击 "Send Request" 执行测试

## 📊 接口覆盖

### 认证模块 (auth.http)

- [x] POST /auth/register - 用户注册
- [x] POST /auth/login - 用户登录

### 用户管理 (user.http)

- [x] POST /user - 创建用户
- [x] GET /user/profile - 获取当前用户信息
- [x] GET /user - 获取所有用户
- [x] GET /user/:id - 获取用户详情
- [x] PATCH /user/:id - 更新用户信息
- [x] DELETE /user/:id - 删除用户

### 实验室管理 (lab.http)

- [x] POST /labs - 创建实验室
- [x] GET /labs - 获取实验室列表
- [x] GET /labs/popular - 获取热门实验室
- [x] GET /labs/:id - 获取实验室详情
- [x] PATCH /labs/:id - 更新实验室信息
- [x] DELETE /labs/:id - 删除实验室

### 仪器管理 (instrument.http)

- [x] POST /instruments - 创建仪器
- [x] GET /instruments - 获取仪器列表
- [x] GET /instruments/:id - 获取仪器详情
- [x] POST /instruments/:id/apply - 申请使用仪器
- [x] GET /instruments/applications - 获取使用申请列表
- [x] POST /instruments/applications/:id/review - 审核使用申请
- [x] POST /instruments/:id/repair - 报告仪器故障
- [x] GET /instruments/repairs - 获取维修记录
- [x] POST /instruments/repairs/:id/update - 更新维修状态

### 预约管理 (appointment.http)

- [x] POST /appointments - 创建预约
- [x] GET /appointments - 获取预约列表
- [x] GET /appointments/my - 获取我的预约
- [x] GET /appointments/pending - 获取待审核预约
- [x] GET /appointments/:id - 获取预约详情
- [x] PATCH /appointments/:id/review - 审核预约
- [x] PATCH /appointments/:id/cancel - 取消预约

### 新闻公告 (news.http)

- [x] POST /news - 发布新闻
- [x] GET /news - 获取新闻列表
- [x] GET /news/pending - 获取待审核新闻
- [x] GET /news/:id - 获取新闻详情
- [x] POST /news/:id/like - 点赞新闻
- [x] PATCH /news/:id/review - 审核新闻

### 通知管理 (notification.http)

- [x] POST /notifications - 创建通知
- [x] GET /notifications - 获取我的通知
- [x] GET /notifications/unread-count - 获取未读数量
- [x] PATCH /notifications/:id/read - 标记为已读
- [x] PATCH /notifications/read-all - 全部标记为已读
- [x] DELETE /notifications/:id - 删除通知

### 收藏管理 (favorites.http)

- [x] POST /favorites/:labId - 添加收藏
- [x] DELETE /favorites/:labId - 取消收藏
- [x] GET /favorites - 获取我的收藏
- [x] GET /favorites/:labId/check - 检查是否收藏

### 评价管理 (evaluation.http)

- [x] POST /evaluations - 提交实验室评价
- [x] GET /evaluations/lab/:labId - 获取实验室评价
- [x] GET /evaluations/lab/:labId/statistics - 获取评价统计

## 🎯 测试场景

### 场景1:学生使用流程

```http
1. 注册/登录 → auth.http
2. 查看实验室 → lab.http
3. 创建预约 → appointment.http
4. 申请仪器 → instrument.http
5. 收藏实验室 → favorites.http
6. 评价实验室 → evaluation.http
7. 查看通知 → notification.http
```

### 场景2:教师管理流程

```http
1. 注册/登录 → auth.http
2. 查看待审核预约 → appointment.http
3. 审核预约 → appointment.http
4. 审核仪器申请 → instrument.http
5. 发布新闻 → news.http
6. 查看用户 → user.http
```

### 场景3:管理员管理流程

```http
1. 注册/登录 → auth.http
2. 创建/管理实验室 → lab.http
3. 创建/管理仪器 → instrument.http
4. 审核新闻 → news.http
5. 管理用户 → user.http
6. 处理维修 → instrument.http
```

## ⚙️ 环境变量

在每个文件中，可以修改以下变量:

```http
@baseUrl = http://localhost:3000
@token = YOUR_JWT_TOKEN_HERE
@username = testuser
@password = 123456
@email = test@example.com
```

## 📝 注意事项

1. **Token 认证**: 大部分接口需要 JWT Token，请在请求头中添加:

   ```
   Authorization: Bearer YOUR_TOKEN
   ```

2. **角色权限**: 不同角色有不同的权限:
   - **STUDENT**: 学生权限
   - **TEACHER**: 教师权限(可审核)
   - **ADMIN**: 管理员权限(全部权限)

3. **ID 替换**: 实际测试时需将示例中的 ID 替换为真实存在的 ID

4. **时间格式**: 使用 ISO 8601 格式:

   ```
   2024-12-30T09:00:00
   ```

5. **状态枚举**: 注意各种状态的枚举值，如:
   - 预约状态: PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED
   - 仪器状态: AVAILABLE, IN_USE, MAINTENANCE, DISABLED

## 🔧 故障排除

| 问题             | 解决方案                                |
| ---------------- | --------------------------------------- |
| 401 Unauthorized | 检查 token 是否有效，是否包含在请求头中 |
| 403 Forbidden    | 确认用户角色有足够权限                  |
| 404 Not Found    | 检查资源 ID 是否存在，路径是否正确      |
| 400 Bad Request  | 验证请求体格式和数据类型                |
| 连接被拒绝       | 确认后端服务已启动，端口正确            |

## 📚 参考资源

- [REST Client 文档](https://github.com/Huachao/vscode-restclient)
- [Postman 官方文档](https://learning.postman.com/)
- [Insomnia 官方文档](https://docs.insomnia.rest/)

## 🤝 贡献指南

欢迎提交新的测试用例或改进现有文件！请确保:

1. 遵循现有的文件结构
2. 添加必要的注释
3. 提供完整的请求示例
4. 标注需要替换的变量

---

**注意**: 这些测试文件仅用于开发和测试目的，请勿在生产环境中使用。
