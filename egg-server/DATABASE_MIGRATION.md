# 数据库迁移说明 - 动态功能

## 概述
本次更新为动态功能添加了点赞和收藏功能，需要创建两个新表。

## 自动迁移
由于项目使用了 Sequelize 的自动同步功能（`app.model.sync()`），新表会在服务器启动时自动创建。

## 新增表结构

### 1. news_likes (点赞记录表)
```sql
CREATE TABLE `news_likes` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '点赞记录唯一标识',
  `userId` INT NOT NULL COMMENT '用户ID',
  `newsId` INT NOT NULL COMMENT '动态ID',
  `createdAt` DATETIME NOT NULL COMMENT '点赞时间',
  `deletedAt` DATETIME NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_userId_newsId` (`userId`, `newsId`) COMMENT '用户ID和动态ID的唯一索引，防止重复点赞',
  INDEX `userId` (`userId`),
  INDEX `newsId` (`newsId`),
  CONSTRAINT `news_likes_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `news_likes_ibfk_2` FOREIGN KEY (`newsId`) REFERENCES `news` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. news_favorites (收藏记录表)
```sql
CREATE TABLE `news_favorites` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '收藏记录唯一标识',
  `userId` INT NOT NULL COMMENT '用户ID',
  `newsId` INT NOT NULL COMMENT '动态ID',
  `createdAt` DATETIME NOT NULL COMMENT '收藏时间',
  `deletedAt` DATETIME NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_userId_newsId` (`userId`, `newsId`) COMMENT '用户ID和动态ID的唯一索引，防止重复收藏',
  INDEX `userId` (`userId`),
  INDEX `newsId` (`newsId`),
  CONSTRAINT `news_favorites_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `news_favorites_ibfk_2` FOREIGN KEY (`newsId`) REFERENCES `news` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 启动步骤

1. 确保数据库连接配置正确
2. 启动服务器：
   ```bash
   cd egg-server
   npm run dev
   ```
3. 服务器会自动创建新表
4. 检查日志确认表创建成功

## 验证

启动后可以通过以下 SQL 验证表是否创建成功：

```sql
-- 查看表结构
DESCRIBE news_likes;
DESCRIBE news_favorites;

-- 查看索引
SHOW INDEX FROM news_likes;
SHOW INDEX FROM news_favorites;
```

## 回滚

如果需要回滚，可以执行：

```sql
DROP TABLE IF EXISTS `news_likes`;
DROP TABLE IF EXISTS `news_favorites`;
```

## 注意事项

1. 新表使用软删除（paranoid: true），删除的记录会保留在数据库中
2. 唯一索引确保用户不能重复点赞或收藏同一条动态
3. 外键约束确保数据完整性
4. 级联删除：当用户或动态被删除时，相关的点赞和收藏记录也会被删除
