# 中间件模块

## CurrentUserMiddleware

### 功能说明

`CurrentUserMiddleware` 是一个用于提取和标准化当前用户信息的中间件。它在 JWT 认证守卫之后执行，负责将 JWT payload 转换为标准的 `UserPayload` 格式。

### 工作流程

1. **JWT 认证**: `JwtAuthGuard` 验证 JWT token 并将 payload 设置到 `request.user`
2. **中间件处理**: `CurrentUserMiddleware` 检测到 `request.user` 存在后，将其转换为标准格式
3. **标准化输出**: 最终 `request.user` 包含完整的 `UserPayload` 信息

### 转换规则

```typescript
// JWT Payload (输入)
{
  sub: number,        // 用户ID
  username: string,   // 用户名
  role: string,      // 用户角色
  email?: string,     // 邮箱(可选)
  status?: number     // 状态(可选)
}

// UserPayload (输出)
{
  id: number,        // 用户ID (从 sub 转换)
  username: string,  // 用户名
  email: string,     // 邮箱 (空字符串作为默认值)
  role: Role,        // 用户角色 (转换为 Role 枚举)
  status: number     // 状态 (1 作为默认值)
}
```

### 应用范围

中间件应用于以下需要认证的路由：

- `/user/*` - 用户管理
- `/appointments/*` - 预约管理
- `/instruments/*` - 仪器管理
- `/news/*` - 新闻管理
- `/notifications/*` - 通知管理
- `/favorites/*` - 收藏管理
- `/evaluations/*` - 评价管理
- `/labs/*` - 实验室管理

### 使用示例

```typescript
// 在控制器中使用
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    // req.user 现在包含标准的 UserPayload 格式
    const { id, username, email, role, status } = req.user;
    // ...
  }
}
```

### 注意事项

1. **执行顺序**: 中间件必须在 `JwtAuthGuard` 之后执行
2. **类型安全**: 中间件确保返回的 `user` 对象符合 `UserPayload` 接口
3. **默认值处理**: 为可选字段提供合理的默认值
4. **错误处理**: 如果转换失败，保持原有的 JWT payload 不变

### 测试

中间件包含完整的单元测试，覆盖以下场景：
- 正常的 JWT payload 转换
- 缺少可选字段的处理
- 无用户信息时的处理