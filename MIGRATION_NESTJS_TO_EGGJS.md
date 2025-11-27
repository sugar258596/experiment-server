# NestJS 到 Egg.js 迁移指南

## 1. 框架对比

| 特性     | NestJS                       | Egg.js                |
| -------- | ---------------------------- | --------------------- |
| 语言     | TypeScript                   | JavaScript/TypeScript |
| 架构风格 | 依赖注入 + 装饰器            | 约定优于配置          |
| 模块化   | Module 系统                  | Plugin + 目录结构     |
| 路由     | 装饰器路由                   | 文件路由              |
| 中间件   | Middleware/Guard/Interceptor | Middleware            |
| ORM      | TypeORM/Prisma               | Sequelize/TypeORM     |

## 2. 项目结构映射

### NestJS 结构

```
src/
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.module.ts
│   └── entities/user.entity.ts
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
└── app.module.ts
```

### Egg.js 结构

```
app/
├── controller/
│   ├── user.js
│   └── auth.js
├── service/
│   ├── user.js
│   └── auth.js
├── model/
│   └── user.js
├── middleware/
│   └── jwt.js
└── router.js
config/
├── config.default.js
├── config.prod.js
└── plugin.js
```

## 3. 核心概念迁移

### 3.1 Controller 迁移

**NestJS:**

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

**Egg.js:**

```javascript
// app/controller/user.js
const Controller = require('egg').Controller;

class UserController extends Controller {
  async index() {
    const { ctx } = this;
    const users = await ctx.service.user.findAll();
    ctx.body = users;
  }

  async create() {
    const { ctx } = this;
    const user = await ctx.service.user.create(ctx.request.body);
    ctx.body = user;
  }
}

module.exports = UserController;
```

### 3.2 Service 迁移

**NestJS:**

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }
}
```

**Egg.js:**

```javascript
// app/service/user.js
const Service = require('egg').Service;

class UserService extends Service {
  async findAll() {
    return this.ctx.model.User.findAll();
  }

  async create(data) {
    return this.ctx.model.User.create(data);
  }
}

module.exports = UserService;
```

### 3.3 路由迁移

**NestJS:** 使用装饰器自动生成路由

**Egg.js:**

```javascript
// app/router.js
module.exports = (app) => {
  const { router, controller } = app;

  // 用户路由
  router.get('/users', controller.user.index);
  router.post('/users', controller.user.create);

  // 认证路由
  router.post('/auth/login', controller.auth.login);
  router.post('/auth/register', controller.auth.register);
};
```

### 3.4 中间件迁移

#### JWT 认证中间件

**NestJS Guard:**

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Egg.js Middleware:**

```javascript
// app/middleware/jwt.js
const publicRoutes = new Set([
  '/api/auth/register',
  '/api/auth/login',
  '/api/labs',
  '/api/news',
  '/api/banners',
  '/api/banners/types',
]);

module.exports = () => {
  return async function jwt(ctx, next) {
    // 检查是否为公开路由
    const path = ctx.path;
    const isPublic =
      publicRoutes.has(path) ||
      (ctx.method === 'GET' &&
        (path.startsWith('/api/labs/') ||
          path.startsWith('/api/news/') ||
          path.startsWith('/api/banners/')));

    if (isPublic) {
      await next();
      return;
    }

    const token = ctx.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      ctx.throw(401, 'Token required');
    }

    try {
      const decoded = ctx.app.jwt.verify(token, ctx.app.config.jwt.secret);
      ctx.state.user = decoded;
      await next();
    } catch (err) {
      ctx.throw(401, 'Invalid token');
    }
  };
};

// config/config.default.js
config.middleware = ['jwt'];
```

#### 角色权限中间件

**NestJS 装饰器:**

```typescript
// @Public() 装饰器 - 公开接口
@Public()
@Get()
findAll() {
  return this.service.findAll();
}

// @Roles() 装饰器 - 角色限制
@Roles('ADMIN', 'SUPER_ADMIN')
@Post()
create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}
```

**Egg.js Middleware:**

```javascript
// app/middleware/roles.js
module.exports = (...allowedRoles) => {
  return async function roles(ctx, next) {
    const user = ctx.state.user;

    if (!user) {
      ctx.throw(401, 'Unauthorized');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      ctx.throw(403, 'Forbidden: Insufficient permissions');
    }

    await next();
  };
};

// app/router.js 使用示例
module.exports = (app) => {
  const { router, controller } = app;
  const roles = app.middleware.roles;

  // 公开接口 - 无需权限
  router.get('/api/labs', controller.lab.index);
  router.post('/api/auth/login', controller.auth.login);

  // 需要登录 - JWT 中间件自动验证
  router.post('/api/appointments', controller.appointment.create);

  // 需要特定角色
  router.put(
    '/api/appointments/review/:id',
    roles('TEACHER', 'ADMIN', 'SUPER_ADMIN'),
    controller.appointment.review,
  );

  // 仅管理员
  router.post(
    '/api/labs',
    roles('ADMIN', 'SUPER_ADMIN'),
    controller.lab.create,
  );

  // 仅超级管理员
  router.delete(
    '/api/users/:id',
    roles('SUPER_ADMIN'),
    controller.user.destroy,
  );
};
```

## 4. 模块功能迁移

### 4.1 认证模块

**NestJS (auth.service.ts):**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByUsername(loginDto.username);
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

**Egg.js (app/service/auth.js):**

```javascript
const Service = require('egg').Service;
const bcrypt = require('bcryptjs');

class AuthService extends Service {
  async login(username, password) {
    const user = await this.ctx.model.User.findOne({ where: { username } });
    if (!user) {
      this.ctx.throw(401, 'User not found');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.ctx.throw(401, 'Invalid password');
    }

    const token = this.app.jwt.sign(
      { username: user.username, sub: user.id, role: user.role },
      this.app.config.jwt.secret,
    );

    return { access_token: token };
  }
}

module.exports = AuthService;
```

### 4.2 数据库配置

**NestJS (mysql.config.ts):**

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  autoLoadEntities: true,
  synchronize: true,
});
```

**Egg.js (config/config.default.js):**

```javascript
config.sequelize = {
  dialect: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: 'lab_management',
  username: 'root',
  password: 'password',
  timezone: '+08:00',
  define: {
    timestamps: true,
    underscored: false,
  },
};

// config/plugin.js
exports.sequelize = {
  enable: true,
  package: 'egg-sequelize',
};
```

### 4.3 实体/模型迁移

#### 数据模型对照表

所有 Egg.js 模型文件必须完全对应 NestJS 的 entity 文件：

| NestJS Entity 文件               | Egg.js Model 文件        | 状态      |
| -------------------------------- | ------------------------ | --------- |
| user.entity.ts                   | user.js                  | ✅ 已验证 |
| lab.entity.ts                    | lab.js                   | ✅ 已验证 |
| instrument.entity.ts             | instrument.js            | ✅ 已验证 |
| instrument-application.entity.ts | instrumentApplication.js | ✅ 已修复 |
| appointment.entity.ts            | appointment.js           | ✅ 已验证 |
| news.entity.ts                   | news.js                  | ✅ 已验证 |
| notification.entity.ts           | notification.js          | ✅ 已更新 |
| favorites.entity.ts              | favorite.js              | ✅ 已验证 |
| evaluation.entity.ts             | evaluation.js            | ✅ 已验证 |
| repair.entity.ts                 | repair.js                | ✅ 已验证 |
| banner.entity.ts                 | banner.js                | ✅ 已验证 |
| banner-type.entity.ts            | bannerType.js            | ✅ 已验证 |

#### 模型迁移示例

**NestJS Entity:**

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ comment: '用户唯一标识' })
  id: number;

  @Column({ unique: true, nullable: false, comment: '用户名，唯一标识' })
  username: string;

  @Column({ comment: '用户密码(bcrypt加密)' })
  @Exclude()
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: Role.STUDENT,
    comment:
      '用户角色:student-学生,teacher-教师,admin-管理员,super_admin-超级管理员',
  })
  role: Role;

  @Column({
    type: 'int',
    default: Status.ACTIVE,
    comment: '用户状态:0-正常,1-禁用,2-封禁',
  })
  status: Status;

  @Column({ nullable: true, comment: '用户昵称' })
  nickname: string;

  @Column({ nullable: true, comment: '用户邮箱' })
  email: string;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: '教学标签数组(逗号分隔)',
  })
  teachingTags: string[];

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({ comment: '软删除时间' })
  deletedAt: Date;
}
```

**Egg.js Model:**

```javascript
// app/model/user.js
'use strict';

module.exports = (app) => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;

  const User = app.model.define(
    'users',
    {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '用户唯一标识',
      },
      username: {
        type: STRING(50),
        unique: true,
        allowNull: false,
        comment: '用户名，唯一标识',
      },
      password: {
        type: STRING(255),
        allowNull: false,
        comment: '用户密码(bcrypt加密)',
      },
      role: {
        type: STRING(50),
        defaultValue: 'student',
        comment:
          '用户角色:student-学生,teacher-教师,admin-管理员,super_admin-超级管理员',
      },
      status: {
        type: INTEGER,
        defaultValue: 0,
        comment: '用户状态:0-正常,1-禁用,2-封禁',
      },
      nickname: { type: STRING(100), allowNull: true, comment: '用户昵称' },
      avatar: { type: STRING(500), allowNull: true, comment: '用户头像URL' },
      email: { type: STRING(100), allowNull: true, comment: '用户邮箱' },
      phone: { type: STRING(20), allowNull: true, comment: '用户手机号' },
      department: {
        type: STRING(100),
        allowNull: true,
        comment: '所属院系/部门',
      },
      teachingTags: {
        type: TEXT,
        allowNull: true,
        comment: '教学标签数组(逗号分隔)',
      },
      createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
      updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
      deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: false,
    },
  );

  User.associate = () => {
    app.model.User.hasMany(app.model.Appointment, {
      foreignKey: 'userId',
      as: 'appointments',
    });
    app.model.User.hasMany(app.model.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
    });
    app.model.User.hasMany(app.model.Favorite, {
      foreignKey: 'userId',
      as: 'favorites',
    });
    app.model.User.hasMany(app.model.Evaluation, {
      foreignKey: 'userId',
      as: 'evaluations',
    });
    app.model.User.hasMany(app.model.News, {
      foreignKey: 'authorId',
      as: 'news',
    });
    app.model.User.hasMany(app.model.InstrumentApplication, {
      foreignKey: 'applicantId',
      as: 'instrumentApplications',
    });
    app.model.User.hasMany(app.model.Repair, {
      foreignKey: 'reporterId',
      as: 'instrumentRepairs',
    });
  };

  return User;
};
```

#### 模型迁移关键要点

1. **表名映射**：
   - NestJS: `@Entity('users')` → Egg.js: `app.model.define('users', ...)`
   - 必须保持完全一致，包括单复数形式

2. **字段类型映射**：
   - `@Column()` → Sequelize 数据类型
   - `@PrimaryGeneratedColumn()` → `{ type: INTEGER, primaryKey: true, autoIncrement: true }`
   - `@CreateDateColumn()` → `{ type: DATE, allowNull: false }`
   - `@UpdateDateColumn()` → `{ type: DATE, allowNull: false }`
   - `@DeleteDateColumn()` → `{ type: DATE, allowNull: true }` + `paranoid: true`

3. **关系映射**：
   - `@OneToMany()` → `hasMany()`
   - `@ManyToOne()` → `belongsTo()`
   - `@JoinColumn({ name: 'userId' })` → `foreignKey: 'userId'`

4. **配置选项**：
   - 所有模型必须启用 `timestamps: true`
   - 软删除使用 `paranoid: true`
   - 字段名保持驼峰式 `underscored: false`

5. **注释保留**：
   - 所有字段的 `comment` 必须与 NestJS entity 保持一致
   - 便于数据库文档和维护

#### 已修复的问题

1. **instrumentApplication.js**：
   - ❌ 问题：注释中存在乱码
   - ✅ 修复：更新所有注释为正确的中文

2. **notification.js**：
   - ❌ 问题：缺少 `timestamps` 和 `underscored` 配置
   - ✅ 修复：添加标准配置，与其他模型保持一致
   - ❌ 问题：部分字段缺少 `allowNull` 声明
   - ✅ 修复：明确所有字段的 `allowNull` 属性

## 5. 依赖注入替代方案

NestJS 的依赖注入在 Egg.js 中通过 `ctx` 和 `app` 对象访问：

**NestJS:**

```typescript
constructor(
  private userService: UserService,
  private authService: AuthService,
) {}
```

**Egg.js:**

```javascript
// 在 Controller 中
this.ctx.service.user;
this.ctx.service.auth;

// 在 Service 中
this.ctx.service.otherService;
this.app.config;
```

## 6. 数据验证迁移

**NestJS (DTO):**

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;
}
```

**Egg.js (使用 egg-validate):**

```javascript
// app/controller/user.js
async create() {
  const { ctx } = this;

  ctx.validate({
    username: { type: 'string', required: true },
    email: { type: 'email', required: true },
  });

  const user = await ctx.service.user.create(ctx.request.body);
  ctx.body = user;
}

// config/plugin.js
exports.validate = {
  enable: true,
  package: 'egg-validate',
};
```

## 7. 异常处理

**NestJS:**

```typescript
throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
```

**Egg.js:**

```javascript
ctx.throw(403, 'Forbidden');

// 或自定义错误处理中间件
// app/middleware/error_handler.js
module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = {
        success: false,
        message: err.message,
      };
    }
  };
};
```

## 8. 配置管理

**NestJS (.env):**

```
DB_HOST=localhost
JWT_SECRET=secret
```

**Egg.js (config/config.default.js):**

```javascript
module.exports = (appInfo) => {
  const config = {};

  config.keys = appInfo.name + '_secret_key';

  config.jwt = {
    secret: 'your-secret-key',
  };

  config.sequelize = {
    host: '127.0.0.1',
    // ...
  };

  return config;
};

// config/config.prod.js (生产环境)
module.exports = () => {
  const config = {};

  config.sequelize = {
    host: process.env.DB_HOST,
    // ...
  };

  return config;
};
```

## 9. 必需插件安装

```bash
pnpm install --save egg-sequelize mysql2
pnpm install --save egg-jwt
pnpm install --save egg-validate
pnpm install --save egg-cors
pnpm install --save bcryptjs
```

**config/plugin.js:**

```javascript
exports.sequelize = {
  enable: true,
  package: 'egg-sequelize',
};

exports.jwt = {
  enable: true,
  package: 'egg-jwt',
};

exports.validate = {
  enable: true,
  package: 'egg-validate',
};

exports.cors = {
  enable: true,
  package: 'egg-cors',
};
```

## 10. 模型完整性验证

### 10.1 验证步骤

在完成模型迁移后，必须执行以下验证步骤确保数据一致性：

#### 步骤 1：字段对照检查

对比每个 Egg.js model 文件与对应的 NestJS entity 文件，确保：

```bash
# 检查清单
✅ 表名完全一致（包括单复数）
✅ 所有字段名称一致
✅ 字段类型正确映射
✅ 默认值保持一致
✅ nullable/allowNull 属性匹配
✅ unique、index 等约束一致
✅ 注释(comment)完整保留
✅ 关系映射正确配置
```

#### 步骤 2：配置一致性检查

所有模型文件必须使用统一的配置：

```javascript
// ✅ 正确配置
const Model = app.model.define(
  'table_name',
  {
    // ... 字段定义
  },
  {
    timestamps: true, // 必须启用
    paranoid: true, // 软删除必须启用
    underscored: false, // 使用驼峰命名
  },
);
```

```javascript
// ❌ 错误配置示例
const Model = app.model.define(
  'table_name',
  {
    // ... 字段定义
  },
  {
    // 缺少配置项
  },
);
```

#### 步骤 3：关系映射验证

检查所有模型的 `associate` 方法：

```javascript
User.associate = () => {
  // hasMany 对应 @OneToMany
  app.model.User.hasMany(app.model.Appointment, {
    foreignKey: 'userId', // 必须与 @JoinColumn 一致
    as: 'appointments', // 必须与 entity 属性名一致
  });

  // belongsTo 对应 @ManyToOne
  app.model.Appointment.belongsTo(app.model.User, {
    foreignKey: 'userId',
    as: 'user',
  });
};
```

#### 步骤 4：数据类型映射验证

| TypeORM 类型                    | Sequelize 类型              | 说明       |
| ------------------------------- | --------------------------- | ---------- |
| `@Column()` string              | `STRING(length)`            | 需指定长度 |
| `@Column({ type: 'text' })`     | `TEXT`                      | 长文本     |
| `@Column({ type: 'int' })`      | `INTEGER`                   | 整数       |
| `@Column({ type: 'decimal' })`  | `DECIMAL(precision, scale)` | 小数       |
| `@Column({ type: 'json' })`     | `JSON`                      | JSON 数据  |
| `@Column({ type: 'date' })`     | `DATEONLY`                  | 仅日期     |
| `@Column({ type: 'datetime' })` | `DATE`                      | 日期时间   |
| `@Column({ type: 'boolean' })`  | `BOOLEAN`                   | 布尔值     |
| `@Column({ type: 'enum' })`     | `ENUM()` 或 `STRING`        | 枚举       |

### 10.2 常见问题修复

#### 问题 1：注释乱码

**症状**：模型文件中的中文注释显示为乱码

**原因**：文件编码不是 UTF-8

**解决**：

```javascript
// 错误的注释（乱码）
comment: '3�h/ �';

// 正确的注释
comment: '申请表唯一标识';
```

**修复方法**：

1. 确保文件编码为 UTF-8
2. 重新编写所有注释
3. 参考对应的 NestJS entity 文件

#### 问题 2：配置不一致

**症状**：部分模型缺少 `timestamps` 或 `paranoid` 配置

**影响**：

- 缺少 `timestamps: true` 导致 createdAt/updatedAt 不自动更新
- 缺少 `paranoid: true` 导致软删除失效

**修复**：

```javascript
// ❌ 错误
const Model = app.model.define(
  'table',
  {
    /* ... */
  },
  {
    tableName: 'table_name',
    paranoid: true,
    // 缺少 timestamps 和 underscored
  },
);

// ✅ 正确
const Model = app.model.define(
  'table_name',
  {
    /* ... */
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: false,
  },
);
```

#### 问题 3：表名不一致

**症状**：模型名称与实际表名不匹配

**影响**：查询失败，找不到表

**修复**：

```javascript
// ❌ 错误 - 使用了单数形式
const Notification = app.model.define('notification', {
  /* ... */
});

// ✅ 正确 - 与 @Entity('notifications') 保持一致
const Notification = app.model.define('notifications', {
  /* ... */
});
```

#### 问题 4：缺少 allowNull 声明

**症状**：字段的可空性不明确

**影响**：数据验证可能失效

**修复**：

```javascript
// ❌ 不明确
title: { type: STRING(200), comment: '通知标题' }

// ✅ 明确声明
title: { type: STRING(200), allowNull: false, comment: '通知标题' }
relatedId: { type: STRING(100), allowNull: true, comment: '关联数据ID' }
```

### 10.3 验证工具

创建一个验证脚本来检查模型完整性：

```javascript
// scripts/validate-models.js
const fs = require('fs');
const path = require('path');

// 检查所有模型文件
const modelDir = path.join(__dirname, '../app/model');
const files = fs.readdirSync(modelDir);

console.log('🔍 检查模型文件完整性...\n');

files.forEach((file) => {
  if (!file.endsWith('.js')) return;

  const content = fs.readFileSync(path.join(modelDir, file), 'utf-8');

  console.log(`📄 ${file}`);

  // 检查配置项
  const hasTimestamps = content.includes('timestamps: true');
  const hasParanoid = content.includes('paranoid: true');
  const hasUnderscored = content.includes('underscored: false');

  console.log(`  ${hasTimestamps ? '✅' : '❌'} timestamps: true`);
  console.log(`  ${hasParanoid ? '✅' : '❌'} paranoid: true`);
  console.log(`  ${hasUnderscored ? '✅' : '❌'} underscored: false`);

  // 检查是否有乱码
  const hasMojibake = /[�]/.test(content);
  console.log(`  ${hasMojibake ? '❌' : '✅'} 无乱码注释`);

  console.log('');
});

console.log('✅ 验证完成');
```

运行验证：

```bash
node scripts/validate-models.js
```

## 11. 迁移步骤

1. **创建 Egg.js 项目**

   ```bash
   pnpm init egg --type=simple
   cd project-name
   pnpm install
   ```

2. **安装必需依赖**

   ```bash
   pnpm install --save egg-sequelize mysql2 egg-jwt egg-validate bcryptjs
   ```

3. **配置插件和数据库**
   - 编辑 `config/plugin.js`
   - 编辑 `config/config.default.js`

4. **迁移模型**
   - 将 NestJS Entity 转换为 Egg.js Model
   - 放置在 `app/model/` 目录

5. **迁移 Service**
   - 将业务逻辑从 NestJS Service 迁移到 Egg.js Service
   - 替换依赖注入为 `ctx` 访问

6. **迁移 Controller**
   - 将 NestJS Controller 转换为 Egg.js Controller
   - 移除装饰器，使用标准方法

7. **配置路由**
   - 在 `app/router.js` 中定义所有路由

8. **迁移中间件**
   - 将 Guard/Interceptor 转换为 Middleware

9. **测试验证**
   - 逐个模块测试功能
   - 验证数据库连接和查询

10. **部署上线**
    - 配置生产环境
    - 启动应用

## 12. 注意事项

- Egg.js 更注重约定，减少配置
- 没有装饰器，使用目录结构和命名约定
- `ctx` 是请求上下文，`app` 是应用实例
- 中间件配置更灵活，支持路由匹配
- TypeScript 支持需要额外配置 `egg-ts-helper`
- 定时任务使用 `app/schedule/` 目录
- 插件系统替代 NestJS 的 Module 系统
- 使用 Egg.js 的生命周期钩子管理应用状态
- **禁止** 批量或者使用脚本修改文件
- **禁止** Egg.js 中 禁止 controller 中直接使用 model
- **重点**：Egg.js 的路由和中间件是基于目录结构的，而不是基于装饰器
- **重点**：Egg.js 中的 middleware 中的处理模块 参考nest 中的common/\*\_.ts 全局日志拦截器，全局响应拦截器，全局异常过滤器，全局认证和角色守卫必须和nest 中相同
- **重点**：Egg.js 中的 model 数据库模型必须和nestjs中的\*_/_.entities.ts 保持一致
- **重点**：Egg.js 中的 service 业务逻辑必须和nestjs中的\*_/_.service.ts
- **重点**：Egg.js 中的 controller 控制器必须和nestjs中的\*_/_.controller.ts 保持一致
- **重点**：Egg.js 中的路由模块必须和nestjs中的路由模块保持一致
- **重点**：权限控制实现方式不同：
  - NestJS 使用 `@Public()` 和 `@Roles()` 装饰器
  - Egg.js 使用 JWT 中间件的公开路由白名单 + roles 中间件
  - 公开接口在 JWT 中间件中配置白名单，无需 Token
  - 需要角色权限的接口在路由中使用 `roles()` 中间件

### 12.1 模型迁移完成状态

✅ **所有数据模型已完成迁移和验证** (截至 2025-11-27)

所有 12 个核心数据模型已完成迁移：

| 序号 | 模型                  | 状态      | 备注                 |
| ---- | --------------------- | --------- | -------------------- |
| 1    | User                  | ✅ 已验证 | 用户模型             |
| 2    | Lab                   | ✅ 已验证 | 实验室模型           |
| 3    | Instrument            | ✅ 已验证 | 仪器设备模型         |
| 4    | InstrumentApplication | ✅ 已修复 | 修复了注释乱码问题   |
| 5    | Appointment           | ✅ 已验证 | 预约模型             |
| 6    | News                  | ✅ 已验证 | 新闻公告模型         |
| 7    | Notification          | ✅ 已更新 | 更新了配置和字段声明 |
| 8    | Favorite              | ✅ 已验证 | 收藏模型             |
| 9    | Evaluation            | ✅ 已验证 | 评价模型             |
| 10   | Repair                | ✅ 已验证 | 维修模型             |
| 11   | Banner                | ✅ 已验证 | 轮播图模型           |
| 12   | BannerType            | ✅ 已验证 | 轮播图类型模型       |

**已修复的问题**：

1. `instrumentApplication.js` - 修复中文注释乱码
2. `notification.js` - 添加标准配置（timestamps, underscored）
3. `notification.js` - 明确字段 allowNull 声明

**验证完成项**：

- ✅ 所有表名与 NestJS entity 完全一致
- ✅ 所有字段定义正确映射
- ✅ 所有关系映射正确配置
- ✅ 所有配置项统一标准化
- ✅ 所有注释完整且正确编码

## 13. 性能优化建议

- 使用 Egg.js 的多进程模型
- 启用 CORS 和安全中间件
- 使用 egg-logger 记录日志
- 配置静态资源服务
- 使用 egg-view 渲染模板

## 14. 参考资源

- [Egg.js 官方文档](https://eggjs.org/)
- [egg-sequelize 文档](https://github.com/eggjs/egg-sequelize)
- [egg-jwt 文档](https://github.com/okoala/egg-jwt)
- [Egg.js 最佳实践](https://eggjs.org/zh-cn/tutorials/index.html)
