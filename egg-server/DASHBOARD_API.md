# Dashboard API 文档

## 概述
Dashboard API 提供了实验室管理系统后台首页的统计数据接口，所有数据均来自系统实际数据，实时统计，无需手动维护。

## API 接口

### 1. 获取面板统计数据
**接口地址**: `GET /api/dashboard/panel`

**功能说明**: 获取首页顶部四个统计面板的数据

**返回数据**:
```json
{
  "success": true,
  "data": {
    "users": 15,         // 实验室总数
    "messages": 120,     // 仪器总数
    "moneys": 8,         // 今日预约数
    "shoppings": 3       // 待处理维修数
  }
}
```

### 2. 获取仪器状态分布
**接口地址**: `GET /api/dashboard/user-access-source`

**功能说明**: 获取不同状态仪器的数量统计（饼图）

**返回数据**:
```json
{
  "success": true,
  "data": [
    { "name": "可用", "value": 85 },
    { "name": "使用中", "value": 20 },
    { "name": "维护中", "value": 10 },
    { "name": "损坏", "value": 3 },
    { "name": "已报废", "value": 2 }
  ]
}
```

### 3. 获取周预约统计
**接口地址**: `GET /api/dashboard/weekly-activity`

**功能说明**: 获取最近7天每天的预约数量（柱状图）

**返回数据**:
```json
{
  "success": true,
  "data": [
    { "name": "周一", "value": 12 },
    { "name": "周二", "value": 18 },
    { "name": "周三", "value": 15 },
    { "name": "周四", "value": 20 },
    { "name": "周五", "value": 25 },
    { "name": "周六", "value": 8 },
    { "name": "周日", "value": 5 }
  ]
}
```

### 4. 获取月度使用统计
**接口地址**: `GET /api/dashboard/monthly-sales`

**功能说明**: 获取当年每月的预约总数和完成数（折线图）

**返回数据**:
```json
{
  "success": true,
  "data": {
    "estimate": [45, 52, 48, 60, 65, 70, 68, 72, 65, 58, 50, 48],  // 预约总数
    "actual": [40, 48, 45, 55, 60, 65, 63, 68, 60, 52, 45, 42]     // 完成数
  }
}
```

## 数据来源说明

| 统计项 | 数据来源 | 说明 |
|--------|---------|------|
| 实验室总数 | Lab 表 | 统计所有实验室 |
| 仪器总数 | Instrument 表 | 统计所有仪器 |
| 今日预约 | Appointment 表 | 统计今天的预约数 |
| 待处理维修 | Repair 表 | 统计状态为 pending/processing 的维修申请 |
| 仪器状态分布 | Instrument 表 | 按 status 字段分组统计 |
| 周预约统计 | Appointment 表 | 统计最近7天每天的预约数（按 appointmentDate） |
| 月度使用统计 | Appointment 表 | 按月统计当年的预约总数和完成数 |

## 仪器状态说明

| 状态值 | 中文名称 | 说明 |
|--------|---------|------|
| available | 可用 | 仪器正常可预约使用 |
| in_use | 使用中 | 仪器正在被使用 |
| maintenance | 维护中 | 仪器正在维护保养 |
| damaged | 损坏 | 仪器损坏待修 |
| retired | 已报废 | 仪器已报废 |

## 前端集成

前端已完成以下修改：

1. **PanelGroup.vue**: 
   - 调用 `/api/dashboard/panel` 获取面板数据
   - 显示：实验室总数、仪器总数、今日预约、待处理维修

2. **Analysis.vue**: 
   - 饼图：调用 `/api/dashboard/user-access-source` 获取仪器状态分布
   - 柱状图：调用 `/api/dashboard/weekly-activity` 获取周预约统计
   - 折线图：调用 `/api/dashboard/monthly-sales` 获取月度使用统计

3. **echarts-data.js**:
   - 更新图表标题和配置，符合实验室管理场景

所有接口调用都使用 JWT Token 进行身份验证。

## 注意事项

1. 所有接口都需要 JWT 认证，请在请求头中携带 `Authorization: Bearer <token>`
2. 数据为实时统计，无需缓存
3. 如果数据库中数据较少，图表可能显示较少的数据点
4. 周预约统计基于 `appointmentDate` 字段，而非创建时间
5. 月度统计仅统计当前年份的数据
