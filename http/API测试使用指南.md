# 实验室预约管理系统 - API测试使用指南

## 概述

本项目提供了完整的 HTTP 测试文件，用于测试所有 RESTful API 接口。这些文件适用于 VS Code 的 REST Client 插件、Postman、Insomnia 等 HTTP 客户端工具。

## 文件结构

```
http/
├── API测试使用指南.md
├── auth.http          # 认证模块
├── user.http          # 用户管理模块
├── lab.http           # 实验室模块
├── instrument.http    # 仪器设备模块
├── appointment.http   # 预约模块
├── news.http          # 新闻公告模块
├── notification.http  # 通知模块
├── favorites.http     # 收藏模块
└── evaluation.http    # 评价模块
```

## 使用前准备

### 1. 环境要求

- 确保已配置 `.env` 文件（参考 `.env.example`）
- 确保 MySQL 数据库已启动并配置正确
- 确保后端服务已启动：`pnpm start:dev`

### 2. 测试顺序建议

由于接口间存在依赖关系，建议按以下顺序进行测试：

1. **认证模块** (`auth.http`) - 先注册和登录获取 token
2. **用户管理** (`user.http`) - 管理用户信息
3. **实验室管理** (`lab.http`) - 创建和管理实验室
4. **仪器管理** (`instrument.http`) - 管理仪器设备
5. **预约管理** (`appointment.http`) - 创建和管理预约
6. **新闻公告** (`news.http`) - 发布和管理新闻
7. **通知管理** (`notification.http`) - 通知功能
8. **收藏管理** (`favorites.http`) - 收藏功能
9. **评价管理** (`evaluation.http`) - 评价功能

## 测试流程示例

### 第一步：启动服务

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm start:dev
```

### 第二步：用户注册和登录

1. 打开 `auth.http` 文件
2. 修改 `@username`、`@password` 等变量
3. 执行 "用户注册" 请求
4. 记录返回的 `access_token`
5. 将 token 复制到其他文件替换 `@token` 变量

### 第三步：修改 token

在所有需要认证的文件中，更新 `@token` 变量：

```http
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 第四步：按模块测试

根据需要测试的功能模块，依次执行相应的 HTTP 请求。

## VS Code REST Client 使用

### 安装插件

在 VS Code 中安装 "REST Client" 插件：

```
ms-rest.vscode-restclient
```

### 使用方法

1. 打开任何 `.http` 文件
2. 在请求上方点击 "Send Request" 按钮
3. 查看响应结果

### 变量替换

支持三种方式使用变量：

1. **文件顶部变量定义**：
```http
@baseUrl = http://localhost:3000
@token = your-jwt-token
```

2. **环境变量**：
```http
GET {{baseUrl}}/user
```

3. **请求体中的变量**：
```json
{
  "username": "{{username}}",
  "password": "{{password}}"
}
```

## 常见问题

### Q1: 401 Unauthorized 错误

**原因**: Token 过期或未提供

**解决**:
- 重新执行登录请求获取新 token
- 确保请求头包含 `Authorization: Bearer {{token}}`

### Q2: 403 Forbidden 错误

**原因**: 用户角色权限不足

**解决**:
- 使用管理员或教师账号
- 检查接口的权限要求

### Q3: 404 Not Found 错误

**原因**: ID 不存在或路径错误

**解决**:
- 检查请求路径是否正确
- 确认资源 ID 存在

### Q4: 400 Bad Request 错误

**原因**: 请求参数不合法

**解决**:
- 检查请求体格式
- 确认必填字段已提供
- 验证数据类型正确

## 测试数据说明

### 角色说明

系统支持三种用户角色：

- **STUDENT (学生)**: 可以创建预约、申请仪器、评价实验室
- **TEACHER (教师)**: 可以审核预约、申请和评价实验室
- **ADMIN (管理员)**: 拥有所有权限，可以管理用户、实验室、仪器等

### 时间格式

所有时间相关字段使用 ISO 8601 格式：

```
2024-12-25T09:00:00
```

### 状态枚举

- **预约状态**: PENDING、APPROVED、REJECTED、COMPLETED、CANCELLED
- **仪器状态**: AVAILABLE、IN_USE、MAINTENANCE、DISABLED
- **新闻状态**: PENDING、APPROVED、REJECTED
- **维修状态**: PENDING、IN_PROGRESS、COMPLETED、CANCELLED

## 完整测试场景

### 场景1：学生预约实验室

1. 注册学生账号并登录
2. 查看可用实验室列表
3. 创建预约申请
4. 查看我的预约
5. 评价实验室

### 场景2：教师审核预约

1. 注册教师账号并登录
2. 查看待审核预约
3. 审核预约申请
4. 创建新闻公告

### 场景3：仪器使用申请

1. 查看仪器列表
2. 申请使用仪器
3. 教师审核申请
4. 报告仪器故障
5. 管理员更新维修状态

## 注意事项

1. **Token 管理**: 登录后请及时更新所有文件中的 token
2. **ID 替换**: 实际测试时需将示例中的 ID 替换为真实存在的 ID
3. **数据清理**: 测试后可清理测试数据，避免影响正式环境
4. **并发测试**: 避免同时对同一资源进行修改操作
5. **权限验证**: 不同角色测试时请切换对应的账号

## 贡献指南

如需添加新的测试用例或修改现有文件，请遵循以下规范：

1. 保持文件结构清晰
2. 添加必要的注释说明
3. 提供完整的请求示例
4. 标注需要替换的变量

---

更多技术细节请参考项目文档和 API 文档。
