# 认证中间件提取当前用户信息实现

## 概述

本次实现为实验室预约管理系统添加了一个统一的中间件来提取和处理当前用户信息，确保所有需要认证的请求都能获得标准化的用户数据。

## 主要更改

### 1. 新增中间件模块

#### 文件结构
```
src/common/middleware/
├── current-user.middleware.ts    # 核心中间件实现
├── current-user.middleware.spec.ts # 单元测试
├── middleware.module.ts          # 中间件模块
├── index.ts                      # 导出文件
└── README.md                     # 文档说明
```

#### 核心功能
- **CurrentUserMiddleware**: 将 JWT payload 转换为标准的 `UserPayload` 格式
- **类型安全**: 使用 TypeScript 接口确保类型一致性
- **错误处理**: 优雅处理各种边界情况

### 2. JWT Token 增强

#### 修改文件: `src/auth/auth.service.ts`
```typescript
private generateToken(user: User): string {
  const payload = {
    username: user.username,
    sub: user.id,
    role: user.role,
    email: user.email,      // 新增
    status: user.status,    // 新增
  };
  return this.jwtService.sign(payload);
}
```

### 3. 应用模块配置

#### 修改文件: `src/app.module.ts`
- 实现 `NestModule` 接口
- 配置中间件应用到所有需要认证的路由
- 添加 `MiddlewareModule` 到导入列表

### 4. 中间件应用范围

中间件应用于以下路由：
- `/user/*` - 用户管理
- `/appointments/*` - 预约管理  
- `/instruments/*` - 仪器管理
- `/news/*` - 新闻管理
- `/notifications/*` - 通知管理
- `/favorites/*` - 收藏管理
- `/evaluations/*` - 评价管理
- `/labs/*` - 实验室管理

## 数据流转换

### 输入 (JWT Payload)
```typescript
{
  sub: number,        // 用户ID
  username: string,   // 用户名
  role: string,      // 用户角色
  email?: string,     // 邮箱(可选)
  status?: number     // 状态(可选)
}
```

### 输出 (UserPayload)
```typescript
{
  id: number,        // 用户ID (从 sub 转换)
  username: string,  // 用户名
  email: string,     // 邮箱 (默认空字符串)
  role: Role,        // 用户角色 (转换为 Role 枚举)
  status: number     // 状态 (默认 1)
}
```

## 使用示例

### 在控制器中使用
```typescript
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    // req.user 现在包含标准的 UserPayload 格式
    const { id, username, email, role, status } = req.user;
    return this.userService.getCurrentUser(req.user);
  }
}
```

## 测试覆盖

中间件包含完整的单元测试：
- ✅ 正常的 JWT payload 转换
- ✅ 缺少可选字段的处理
- ✅ 无用户信息时的处理
- ✅ 类型安全的验证

## 技术特性

### 类型安全
- 使用 TypeScript 接口定义
- 类型断言确保枚举类型正确
- 可选字段的默认值处理

### 性能优化
- 中间件仅在需要认证的路由执行
- 轻量级转换逻辑
- 避免不必要的数据库查询

### 错误处理
- 优雅处理缺失字段
- 保持原有数据在转换失败时不变
- 不影响请求的正常处理

## 兼容性

- ✅ 与现有 `JwtAuthGuard` 完全兼容
- ✅ 不影响公开路由的正常访问
- ✅ 保持现有 API 接口不变
- ✅ 向后兼容现有代码

## 部署说明

1. **无需数据库迁移**: 中间件不涉及数据库结构变更
2. **无需重启**: 支持热重载部署
3. **配置更新**: 已自动配置到应用模块中

## 验证方法

1. **构建测试**: `npm run build` ✅
2. **单元测试**: `npm test -- current-user.middleware.spec.ts` ✅
3. **类型检查**: TypeScript 编译无错误 ✅

## 总结

本次实现成功地为系统添加了统一的用户信息提取中间件，确保：

1. **一致性**: 所有认证请求获得相同格式的用户信息
2. **类型安全**: 完整的 TypeScript 类型支持
3. **可维护性**: 清晰的代码结构和文档
4. **可测试性**: 完整的单元测试覆盖
5. **向后兼容**: 不影响现有功能

这为后续的用户权限管理和业务逻辑开发提供了坚实的基础。