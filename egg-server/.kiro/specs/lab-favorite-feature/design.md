# 设计文档

## 概述

本设计文档描述了实验室收藏功能的完整实现方案。该功能允许用户在实验室列表页和详情页中收藏或取消收藏实验室，并在收藏列表页查看所有已收藏的实验室。系统将在后端查询实验室数据时自动附加当前用户的收藏状态，确保前端能够正确显示收藏图标。

## 架构

### 系统架构

```
┌─────────────────┐
│   前端 (Vue 3)  │
│  - 实验室列表页  │
│  - 实验室详情页  │
│  - 收藏列表页    │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│  后端 (Egg.js)  │
│  - Controller   │
│  - Service      │
│  - Model        │
└────────┬────────┘
         │
┌────────▼────────┐
│   数据库 (MySQL) │
│  - labs 表      │
│  - favorites 表 │
│  - users 表     │
└─────────────────┘
```

### 数据流

1. **查询实验室列表/详情**：
   - 前端请求实验室数据
   - 后端查询实验室信息
   - 后端查询当前用户的收藏记录
   - 后端为每个实验室添加 `isFavorite` 字段
   - 返回包含收藏状态的实验室数据

2. **切换收藏状态**：
   - 前端发送切换收藏请求
   - 后端检查收藏记录是否存在
   - 如果存在则删除，否则创建
   - 返回操作结果
   - 前端更新UI状态

## 组件和接口

### 后端组件

#### 1. Lab Service 扩展

**文件**: `egg-server/app/service/lab.js`

**新增方法**:

```javascript
/**
 * 为实验室数据添加收藏状态
 * @param {Array|Object} labs - 实验室数据（单个或数组）
 * @param {number} userId - 用户ID
 * @return {Array|Object} 包含收藏状态的实验室数据
 */
async attachFavoriteStatus(labs, userId)
```

**修改方法**:
- `findAll(query)` - 添加收藏状态附加逻辑
- `findById(id)` - 添加收藏状态附加逻辑
- `getPopularLabs(query)` - 添加收藏状态附加逻辑

#### 2. Lab Controller 扩展

**文件**: `egg-server/app/controller/lab.js`

**修改方法**:
- `index()` - 传递用户ID到service层
- `show()` - 传递用户ID到service层
- `getPopularLabs()` - 传递用户ID到service层

#### 3. Favorite Service (已存在)

**文件**: `egg-server/app/service/favorite.js`

现有方法保持不变：
- `toggle(userId, labId)` - 切换收藏状态
- `getMyFavorites(userId, query)` - 获取用户收藏列表

### 前端组件

#### 1. 实验室列表页

**文件**: `web/src/views/labs/index.vue`

**修改内容**:
- 添加 `handleToggleFavorite` 方法处理收藏切换
- 在 `LabCard` 组件上绑定 `@toggleFavorite` 事件
- 收藏成功后刷新列表数据

#### 2. 实验室详情页

**文件**: `web/src/views/labs/detail.vue`

**新增内容**:
- 添加收藏按钮UI
- 添加 `handleToggleFavorite` 方法
- 添加收藏状态的计算属性
- 显示收藏/已收藏状态

#### 3. LabCard 组件 (已存在)

**文件**: `web/src/components/Lab/src/LabCard.vue`

组件已经支持收藏功能：
- `showFavorite` prop 控制是否显示收藏按钮
- `lab.isFavorite` 控制收藏图标状态
- `@toggleFavorite` 事件发射

### API 接口

#### 1. 获取实验室列表

```
GET /api/labs
```

**响应数据变化**:
```javascript
{
  success: true,
  data: [
    {
      id: 1,
      name: "物理实验室",
      // ... 其他字段
      isFavorite: true  // 新增字段
    }
  ]
}
```

#### 2. 获取实验室详情

```
GET /api/labs/:id
```

**响应数据变化**:
```javascript
{
  success: true,
  data: {
    id: 1,
    name: "物理实验室",
    // ... 其他字段
    isFavorite: false  // 新增字段
  }
}
```

#### 3. 切换收藏状态 (已存在)

```
POST /api/favorites/appointments/:labId
```

**请求**: 无需body，labId在URL中

**响应**:
```javascript
{
  success: true,
  message: "收藏成功" | "已取消收藏",
  data: {
    isFavorited: false,
    message: "已取消收藏"
  }
}
```

#### 4. 获取收藏列表 (已存在)

```
GET /api/favorites/appointments
```

**响应**:
```javascript
{
  success: true,
  data: {
    data: [
      {
        id: 1,
        userId: 1,
        labId: 1,
        lab: { /* 实验室详情 */ }
      }
    ],
    total: 10
  }
}
```

## 数据模型

### Lab Model (现有)

```javascript
{
  id: INTEGER,
  name: STRING(100),
  location: STRING(200),
  capacity: INTEGER,
  description: TEXT,
  images: JSON,
  status: INTEGER,
  department: STRING(100),
  tags: JSON,
  rating: DECIMAL(3, 2),
  createdAt: DATE,
  updatedAt: DATE,
  deletedAt: DATE
}
```

### Favorite Model (现有)

```javascript
{
  id: INTEGER,
  userId: INTEGER,
  labId: INTEGER,
  createdAt: DATE,
  deletedAt: DATE
}
```

### 运行时数据扩展

在返回给前端时，Lab 对象将被扩展：

```javascript
{
  // ... 所有原有字段
  isFavorite: BOOLEAN  // 运行时添加
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 收藏切换正确性

*对于任何*用户和实验室，当用户点击收藏按钮时，系统应该切换该实验室的收藏状态（未收藏→已收藏，或已收藏→未收藏）

**验证**: 需求 1.1, 2.4

### 属性 2: 收藏状态显示一致性

*对于任何*实验室，其UI显示状态（图标颜色、按钮文本）应该与 `isFavorite` 字段的值一致（true时显示已收藏状态，false时显示未收藏状态）

**验证**: 需求 1.2, 1.3, 2.2, 2.3, 2.5

### 属性 3: 收藏数据正确性

*对于任何*用户和实验室，系统返回的 `isFavorite` 字段应该准确反映数据库中的收藏记录（存在收藏记录时为true，不存在时为false）

**验证**: 需求 3.1, 3.2, 3.3, 3.4

### 属性 4: 未登录用户收藏状态

*对于任何*未登录的用户请求，所有实验室的 `isFavorite` 字段应该为 `false`

**验证**: 需求 3.5

### 属性 5: 收藏列表完整性

*对于任何*用户，收藏列表API返回的实验室数量应该等于该用户在 favorites 表中的有效记录数量

**验证**: 需求 4.1

### 属性 6: 收藏操作反馈

*对于任何*收藏或取消收藏操作，系统应该显示相应的提示消息（成功时显示成功提示，失败时显示错误提示）

**验证**: 需求 1.5, 1.6

### 属性 7: 跨页面状态一致性

*对于任何*用户在任何页面（列表页、详情页、收藏列表页）进行收藏或取消收藏操作后，该实验室在所有页面中的收藏状态应该保持一致

**验证**: 需求 5.1, 5.2, 5.3

### 属性 8: 收藏状态持久性

*对于任何*用户在任何页面进行收藏操作后刷新页面，系统应该从服务器重新获取数据，并显示与数据库一致的收藏状态

**验证**: 需求 5.5

### 属性 9: 收藏列表更新正确性

*对于任何*用户在收藏列表页取消收藏某个实验室后，该实验室应该从收藏列表中移除

**验证**: 需求 4.4

## 错误处理

### 后端错误处理

1. **实验室不存在**
   - 场景：用户尝试收藏不存在的实验室
   - 处理：返回 404 错误，消息"实验室不存在"

2. **用户未登录**
   - 场景：未登录用户尝试收藏操作
   - 处理：JWT中间件拦截，返回 401 错误

3. **数据库操作失败**
   - 场景：数据库连接失败或查询错误
   - 处理：返回 500 错误，记录错误日志

4. **重复收藏**
   - 场景：用户尝试收藏已收藏的实验室
   - 处理：toggle方法自动处理，取消收藏

### 前端错误处理

1. **网络请求失败**
   - 处理：显示错误提示消息
   - UI：保持原有状态，不改变收藏图标

2. **操作成功反馈**
   - 处理：显示成功提示消息
   - UI：立即更新收藏图标状态

3. **加载状态**
   - 处理：在数据加载时显示loading状态
   - UI：禁用收藏按钮防止重复点击

## 测试策略

### 单元测试

#### 后端单元测试

1. **Lab Service 测试**
   - 测试 `attachFavoriteStatus` 方法正确添加收藏状态
   - 测试单个实验室和实验室数组的处理
   - 测试未登录用户（userId为null）的情况

2. **Favorite Service 测试**
   - 测试 `toggle` 方法的收藏和取消收藏逻辑
   - 测试不存在的实验室ID
   - 测试不存在的用户ID

#### 前端单元测试

1. **LabCard 组件测试**
   - 测试收藏图标根据 `isFavorite` 正确显示
   - 测试点击收藏图标触发 `toggleFavorite` 事件
   - 测试事件冒泡被阻止

2. **实验室列表页测试**
   - 测试 `handleToggleFavorite` 方法调用API
   - 测试收藏成功后刷新列表
   - 测试错误处理

### 属性测试

我们将使用 **fast-check** 库进行属性测试（JavaScript的属性测试库）。每个属性测试将运行至少100次迭代。

#### 属性测试 1: 收藏切换正确性

```javascript
/**
 * Feature: lab-favorite-feature, Property 1: 收藏切换正确性
 * 验证: 需求 1.1, 2.4
 */
```

**测试策略**:
- 生成随机用户ID和实验室ID
- 记录初始收藏状态
- 调用toggle API
- 验证收藏状态已切换（true→false 或 false→true）

#### 属性测试 2: 收藏状态显示一致性

```javascript
/**
 * Feature: lab-favorite-feature, Property 2: 收藏状态显示一致性
 * 验证: 需求 1.2, 1.3, 2.2, 2.3, 2.5
 */
```

**测试策略**:
- 生成随机的实验室数据和isFavorite值
- 渲染LabCard组件和详情页收藏按钮
- 验证UI状态（图标颜色、按钮文本）与isFavorite值匹配

#### 属性测试 3: 收藏数据正确性

```javascript
/**
 * Feature: lab-favorite-feature, Property 3: 收藏数据正确性
 * 验证: 需求 3.1, 3.2, 3.3, 3.4
 */
```

**测试策略**:
- 生成随机用户ID和实验室列表
- 为部分实验室创建收藏记录
- 调用attachFavoriteStatus方法
- 验证每个实验室的isFavorite与数据库记录一致

#### 属性测试 4: 未登录用户收藏状态

```javascript
/**
 * Feature: lab-favorite-feature, Property 4: 未登录用户收藏状态
 * 验证: 需求 3.5
 */
```

**测试策略**:
- 生成随机实验室列表
- 不传递用户ID（userId为null或undefined）
- 调用attachFavoriteStatus方法
- 验证所有实验室的isFavorite都为false

#### 属性测试 5: 收藏列表完整性

```javascript
/**
 * Feature: lab-favorite-feature, Property 5: 收藏列表完整性
 * 验证: 需求 4.1
 */
```

**测试策略**:
- 生成随机用户ID
- 创建随机数量（0-20）的收藏记录
- 调用getMyFavorites API
- 验证返回的total等于创建的记录数

#### 属性测试 6: 收藏操作反馈

```javascript
/**
 * Feature: lab-favorite-feature, Property 6: 收藏操作反馈
 * 验证: 需求 1.5, 1.6
 */
```

**测试策略**:
- 生成随机的收藏操作（成功和失败场景）
- 执行操作并捕获UI反馈
- 验证成功时显示成功消息，失败时显示错误消息

#### 属性测试 7: 跨页面状态一致性

```javascript
/**
 * Feature: lab-favorite-feature, Property 7: 跨页面状态一致性
 * 验证: 需求 5.1, 5.2, 5.3
 */
```

**测试策略**:
- 生成随机用户ID和实验室ID
- 在随机选择的页面执行收藏操作
- 查询其他页面的数据
- 验证所有页面返回的isFavorite状态一致

#### 属性测试 8: 收藏状态持久性

```javascript
/**
 * Feature: lab-favorite-feature, Property 8: 收藏状态持久性
 * 验证: 需求 5.5
 */
```

**测试策略**:
- 生成随机用户ID和实验室ID
- 执行收藏操作
- 模拟页面刷新（重新调用API）
- 验证返回的收藏状态与数据库一致

#### 属性测试 9: 收藏列表更新正确性

```javascript
/**
 * Feature: lab-favorite-feature, Property 9: 收藏列表更新正确性
 * 验证: 需求 4.4
 */
```

**测试策略**:
- 生成随机用户ID和多个收藏记录
- 获取初始收藏列表
- 随机选择一个实验室取消收藏
- 重新获取收藏列表
- 验证该实验室已从列表中移除，且总数减1

### 集成测试

1. **端到端收藏流程**
   - 用户登录
   - 浏览实验室列表
   - 点击收藏按钮
   - 验证收藏列表中出现该实验室
   - 在详情页验证收藏状态

2. **跨页面状态同步**
   - 在列表页收藏实验室
   - 导航到详情页验证状态
   - 导航到收藏列表验证存在

## 实现注意事项

### 性能优化

1. **批量查询收藏状态**
   - 在查询实验室列表时，使用单次查询获取所有收藏记录
   - 避免为每个实验室单独查询收藏状态

2. **数据库索引**
   - 在 `favorites` 表的 `(userId, labId)` 上创建复合索引
   - 提高收藏状态查询性能

### 安全性

1. **权限验证**
   - 所有收藏操作需要用户登录
   - 用户只能操作自己的收藏记录

2. **参数验证**
   - 验证 labId 是否为有效的整数
   - 验证实验室是否存在

### 用户体验

1. **乐观更新**
   - 点击收藏按钮后立即更新UI
   - 如果API调用失败，回滚UI状态

2. **防抖处理**
   - 防止用户快速连续点击收藏按钮
   - 在请求进行中禁用按钮

3. **视觉反馈**
   - 收藏成功显示成功提示
   - 取消收藏显示取消提示
   - 使用动画效果增强交互体验
