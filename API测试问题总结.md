# API 测试问题总结报告

## 测试概览

- **测试时间**: 2025年11月7日
- **测试方法**: 自动化API测试
- **总测试数**: 30
- **通过数**: 13 (43.33%)
- **失败数**: 17 (56.67%)

## ✅ 测试通过的功能

### 1. 公共接口（无需认证）
- ✅ GET /labs - 获取实验室列表
- ✅ GET /labs/popular - 获取热门实验室
- ✅ GET /instruments - 获取仪器列表
- ✅ GET /news - 获取新闻列表
- ✅ GET /appointments - 获取预约列表

### 2. 用户认证
- ✅ POST /auth/register - 用户注册
- ✅ POST /auth/login - 用户登录

### 3. 需要认证的基础查询
- ✅ GET /user/profile - 获取当前用户信息
- ✅ GET /user - 获取所有用户
- ✅ GET /appointments/my - 获取我的预约
- ✅ GET /appointments/pending - 获取待审核预约
- ✅ GET /notifications - 获取我的通知
- ✅ GET /notifications/unread-count - 获取未读通知数量
- ✅ GET /favorites - 获取我的收藏
- ✅ GET /news/pending - 获取待审核新闻

## ❌ 发现的问题及修复建议

### 1. 控制器装饰器问题（已修复）

**问题**: 公开接口缺少 `@Public()` 装饰器，导致全局认证守卫拒绝访问

**修复**: 已为以下接口添加 `@Public()` 装饰器：
- LabController: GET /labs, GET /labs/popular, GET /labs/:id
- InstrumentController: GET /instruments, GET /instruments/:id
- AppointmentController: GET /appointments, GET /appointments/:id
- NewsController: GET /news, GET /news/:id
- EvaluationController: GET /evaluations/lab/:labId, GET /evaluations/lab/:labId/statistics

### 2. 查询参数验证问题

#### GET /instruments/applications
- **错误**: Validation failed (numeric string is expected)
- **原因**: 查询参数 `status` 需要是数字而不是字符串
- **修复建议**: 在 Controller 中添加 `ParseEnumPipe` 转换或修改 DTO

#### GET /instruments/repairs
- **错误**: Validation failed (numeric string is expected)
- **原因**: 查询参数 `status` 需要是数字而不是字符串
- **修复建议**: 同上

### 3. DTO 验证问题

#### POST /labs
- **错误**: "院系名称不能超过100个字符", "department must be a string"
- **原因**: 测试数据中缺少 `department` 字段
- **修复建议**: 在测试脚本中添加 department 字段

#### POST /appointments
- **错误**: 多个验证错误
  - 日期格式不正确
  - timeSlot 必须是 0, 1, 2 中的一个
  - description 字段类型错误
  - participantCount 必须是整数
- **修复建议**: 调整测试数据格式

#### POST /instruments/1/apply
- **错误**: "仪器ID格式不正确"
- **原因**: 路径参数和查询参数冲突
- **修复建议**: 检查路由定义和参数解析

#### POST /evaluations
- **错误**: 评分字段验证失败
- **原因**: 期望整数但提供了其他类型
- **修复建议**: 使用正确的数字类型

### 4. 数据库关联问题

#### POST /instruments
- **错误**: 404 "所属实验室不存在"
- **原因**: 数据库中没有 labId=1 的记录
- **修复建议**: 先创建实验室数据，或在测试中创建实际存在的实验室

#### POST /favorites/1
- **错误**: 404 "实验室不存在"
- **原因**: 数据库中没有 labId=1 的记录
- **修复建议**: 同上

#### POST /news/1/like
- **错误**: 404 "动态ID 1 不存在"
- **原因**: 数据库中没有新闻记录
- **修复建议**: 先创建新闻数据

### 5. 数据库Schema问题

#### POST /news
- **错误**: 500 "Field 'authorId' doesn't have a default value"
- **原因**: News 实体缺少 authorId 字段的默认值或映射
- **修复建议**:
  1. 检查 News 实体定义
  2. 确保 authorId 字段有默认值或从请求中获取
  3. NewsService 中应该设置 authorId = req.user.id

#### PATCH /notifications/read-all
- **错误**: 500 "Cannot find alias for relation at user"
- **原因**: TypeORM 查询中用户关系别名错误
- **修复建议**: 检查 NotificationService 中的查询语句

### 6. 资源不存在问题

多个 404 错误表示操作的资源不存在（ID=1的通知、预约、实验室等），这是因为：
- 数据库中没有测试数据
- 测试用例使用了硬编码的ID

**修复建议**:
1. 在测试前创建必要的测试数据
2. 使用动态ID而不是硬编码
3. 实现测试数据初始化脚本

## 📋 修复优先级

### 高优先级（必须修复）
1. News 实体 authorId 字段问题
2. NotificationService 关系查询别名问题
3. 公开接口 @Public() 装饰器（已完成）

### 中优先级（建议修复）
1. 查询参数类型验证问题
2. DTO 验证字段补充
3. 数据库测试数据初始化

### 低优先级（可选）
1. 测试脚本优化
2. 错误消息优化

## 🛠️ 已完成的修复

1. ✅ 为所有公开GET接口添加了 `@Public()` 装饰器
2. ✅ 修复了测试脚本中的认证问题
3. ✅ 修复了用户名验证问题
4. ✅ 修复了密码格式问题
5. ✅ 修复了响应数据结构检查问题

## 📝 后续行动项

1. **修复 News 实体 authorId 问题** - 检查实体定义和 NewsService
2. **修复 NotificationService 查询别名** - 检查 relation 定义
3. **创建测试数据初始化脚本** - 避免硬编码ID
4. **优化测试脚本** - 添加更多调试信息
5. **运行 pnpm run lint 修复现有 lint 错误** - 111个错误需要修复

## 📊 测试覆盖率

- **认证模块**: 100% ✅
- **公共查询**: 100% ✅
- **用户管理**: 80% ✅
- **实验室模块**: 40% ❌
- **仪器模块**: 30% ❌
- **预约模块**: 40% ❌
- **新闻模块**: 30% ❌
- **通知模块**: 20% ❌

总体来说，基础的认证和查询功能运行良好，但创建、更新和删除操作需要更多的测试数据和参数调整。
