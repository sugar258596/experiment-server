# CLAUDE.md

本文件用于为 **Claude Code**（[claude.ai/code](https://claude.ai/code)）提供在本项目中编写和维护代码的开发指引。

---

## 一、项目概述

本项目是一个基于 **NestJS** 的 **高校实验室预约管理系统（University Laboratory Reservation Management System）**。
系统提供数字化实验室管理能力，支持学生预约、教师审核以及管理员管理等功能。

---

## 二、技术栈

- **后端框架**：NestJS 10.x
- **数据库**：MySQL 8.0.x（使用 TypeORM）
- **认证机制**：JWT（结合 bcryptjs）
- **数据验证**：class-validator 与 class-transformer
- **语言**：TypeScript
- **包管理器**：⚙️ **pnpm（强制使用）**

> ⚠️ **严格强制要求**
> - 所有开发者**必须**使用 **pnpm** 进行依赖管理
> - **禁止**使用 npm 或 yarn
> - 项目已根据 pnpm 的锁定文件与工作区行为进行优化
> - **每次修改代码后必须执行** `pnpm run lint` 进行代码质量检查

---

## 三、开发命令

### 启动项目

```bash
# 开发模式（热更新）
pnpm start:dev

# 构建并启动生产环境
pnpm build
pnpm start:prod
```

### 测试命令

```bash
# 运行全部测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov

# 端到端测试（E2E）
pnpm test:e2e

# 调试测试
pnpm test:debug
```

### 代码质量（**必须执行**）

```bash
# ⚠️ 每次修改代码后必须执行此命令
# 执行 Lint 并自动修复（强制要求）
pnpm lint

# 使用 Prettier 格式化代码
pnpm format
```

> ✅ **开发流程规范**：
> 1. 修改代码
> 2. 执行 `pnpm run lint`（强制要求）
> 3. 确保通过所有 lint 检查
> 4. 提交代码


---

## 四、系统架构

### 模块化结构

本项目采用 **模块化架构**，共包含 9 个主要功能模块（见 `src/app.module.ts` 第 18–40 行）：

1. **UserModule** – 用户管理（学生、教师、管理员）
2. **AuthModule** – 登录认证与 JWT 令牌管理
3. **LabModule** – 实验室信息管理
4. **InstrumentModule** – 仪器设备管理与申请流程
5. **AppointmentModule** – 实验室预约系统
6. **NewsModule** – 实验室公告与动态
7. **NotificationModule** – 消息通知模块
8. **FavoritesModule** – 用户收藏模块
9. **EvaluationModule** – 实验室与设备评价模块

---

## 五、配置文件说明

**数据库配置**（`src/config/mysql.config.ts`）：

- 使用 MySQL 8.0 + TypeORM
- 开发环境启用自动同步（`synchronize: true`）
- 自动加载实体（`autoLoadEntities: true`）
- 含连接重试机制
- 时区设置为 `+08:00`（Asia/Shanghai）

**环境变量示例**（`.env.example`）：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=lab_management
JWT_SECRET=your-secret-key-change-this-in-production
```

---

## 六、认证流程

系统使用 JWT 认证机制（`src/auth/auth.service.ts`）：

1. **注册**（`auth.service.ts:18`）
   - 检查用户名唯一性
   - 使用 bcrypt 进行密码加密（10 轮盐值）
   - 创建用户并分配角色

2. **登录**（`auth.service.ts:55`）
   - 根据用户名查找用户
   - 验证密码与账户状态
   - 生成 JWT Token

3. **令牌结构**
   包含：`username`、`sub`（用户ID）与 `role`

用户角色包括：`STUDENT`（学生）、`TEACHER`（教师）、`ADMIN`（管理员）

---

## 七、模块说明

### 通用模式

每个模块均遵循 NestJS 最佳实践：

- **Controller**：处理 HTTP 请求与响应
- **Service**：封装业务逻辑
- **Entity**：TypeORM 实体模型
- **DTO**：数据传输与验证对象

---

### 用户管理模块（UserModule）

`src/user/entities/user.entity.ts`：

- 用户基本信息（用户名、邮箱、手机号）
- 基于角色的访问控制
- 账户状态（ACTIVE / DISABLED）

---

### 实验室与预约模块（AppointmentModule）

`src/appointment/` 目录：

- 学生与教师可发起预约
- 教师可审批预约申请
- 支持多时段（上午/下午/晚上）预约
- 状态管理：`PENDING`、`APPROVED`、`REJECTED`、`COMPLETED`、`CANCELLED`

---

### 仪器设备模块（InstrumentModule）

主要功能：

- 管理仪器/设备信息
- 仪器使用申请与维修申请
- 仪器状态更新与追踪

---

## 八、开发环境搭建步骤

1. **安装依赖**

   ```bash
   pnpm install
   ```

2. **配置数据库（MySQL 8.0+）**
   - 创建数据库 `lab_management`
   - 在 `.env` 中填写正确的数据库连接信息
   - 开发环境下 TypeORM 自动同步实体结构

3. **启动开发服务器**

   ```bash
   pnpm start:dev
   ```

---

## 九、测试

测试文件统一使用 `.spec.ts` 后缀。
示例：

- `src/user/user.controller.spec.ts`
- `src/user/user.service.spec.ts`
- `src/app.controller.spec.ts`

运行指定测试文件：

```bash
pnpm test -- user.service.spec.ts
```

---

## 十、代码质量规范

### Lint 检查（强制要求）

**每次修改代码后必须执行：**

```bash
pnpm lint
```

> ⚠️ **重要说明**：
> - 提交代码前必须通过 lint 检查
> - lint 检查包括 ESLint 规则和代码格式化
> - 使用 `--fix` 参数自动修复可修复的问题
> - 不可修复的问题需要手动调整代码

### 开发工作流程

1. **编写代码**
2. **运行 lint 检查**：`pnpm run lint`（必须）
3. **修复所有 lint 错误**
4. **测试功能**：确保测试通过
5. **提交代码**：仅在通过 lint 检查后提交

---

## 十一、注意事项

- **开发环境** 开启 TypeORM 自动同步（生产环境需关闭）
- JWT Token 内包含用户角色信息，用于权限判断
- 所有时间戳统一使用 `Asia/Shanghai (+08:00)` 时区
- 密码使用 bcrypt 加密（10 轮盐值）
- 系统遵循 **RESTful API** 设计规范
- **严格禁止使用 npm 或 yarn**，所有依赖管理必须通过 pnpm

---

## 十二、API 路由结构

| 模块       | 路由前缀         | 功能描述       |
| :--------- | :--------------- | :------------- |
| 用户模块   | `/users`         | 用户管理       |
| 认证模块   | `/auth`          | 登录与注册     |
| 实验室模块 | `/labs`          | 实验室操作     |
| 仪器模块   | `/instruments`   | 仪器管理       |
| 预约模块   | `/appointments`  | 实验室预约     |
| 公告模块   | `/news`          | 新闻公告       |
| 通知模块   | `/notifications` | 用户通知       |
| 收藏模块   | `/favorites`     | 用户收藏       |
| 评价模块   | `/evaluations`   | 用户评价与评分 |

---

## 十三、常见问题与解决方案

| 问题             | 可能原因                           | 解决方案                                  |
| :--------------- | :--------------------------------- | :---------------------------------------- |
| 无法连接数据库   | `.env` 配置错误或 MySQL 未启动     | 检查数据库连接信息并启动服务              |
| JWT 报错         | `JWT_SECRET` 未设置或不一致        | 确认 `.env` 文件中密钥一致                |
| TypeORM 同步异常 | 生产环境启用了 `synchronize: true` | 禁用自动同步并使用 migration              |
| 模块导入错误     | 未在 `app.module.ts` 注册模块      | 确认模块已正确引入                        |
| 包版本冲突       | 使用了 npm/yarn 安装依赖           | 删除 `node_modules` 并使用 `pnpm install` |
| Lint 检查失败    | 代码不符合 ESLint 规范             | 运行 `pnpm lint` 并修复所有错误           |

---

## 十四、包管理器规范（强制执行）

### 严格使用 pnpm

项目**强制**使用 pnpm 管理依赖。请确保系统中已安装 pnpm 9.0.0 或更高版本。

#### 安装 pnpm（如未安装）

```bash
npm install -g pnpm@latest
```

#### package.json 配置

项目 `package.json` 中包含以下强制配置：

```json
{
  "engines": {
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

#### 依赖安装

```bash
# ✅ 正确方式
pnpm install

# ❌ 错误方式（严格禁止）
npm install
yarn install
```

#### 错误恢复流程

如误用 npm/yarn 安装依赖，请执行以下操作：

```bash
# 删除错误的锁定文件和依赖
rm -rf node_modules package-lock.json yarn.lock

# 重新安装
pnpm install
```

---

## 十五、开发流程检查清单

在每次提交代码前，请确认以下所有项目：

- [ ] 代码已修改完成
- [ ] 执行了 `pnpm run lint` 命令
- [ ] 所有 lint 检查通过（无错误或警告）
- [ ] 所有测试通过 `pnpm test`
- [ ] 功能测试正常
- [ ] 使用 `pnpm` 管理所有依赖（未使用 npm/yarn）
- [ ] 代码符合项目的 TypeScript 和 NestJS 规范

---

## 十六、联系与支持

如遇到问题，请检查：

1. 是否正确使用 pnpm
2. 是否执行了 `pnpm run lint`
3. 是否已解决所有 lint 错误
4. 依赖是否正确安装

严格遵循以上规范，确保代码质量和团队协作效率。

