'use strict';

/**
 * 角色权限中间件
 * 参考 NestJS 的 RolesGuard 实现
 * 检查用户是否具有访问资源所需的角色权限
 */

// 角色枚举
const Role = {
  STUDENT: 'STUDENT',         // 学生
  TEACHER: 'TEACHER',         // 教师
  ADMIN: 'ADMIN',             // 管理员
  SUPER_ADMIN: 'SUPER_ADMIN', // 超级管理员
};

// 角色优先级(数值越大，权限越高)
const RolePriority = {
  [Role.STUDENT]: 1,
  [Role.TEACHER]: 2,
  [Role.ADMIN]: 3,
  [Role.SUPER_ADMIN]: 4,
};

// 角色中文名称映射
const RoleNames = {
  [Role.STUDENT]: '学生',
  [Role.TEACHER]: '教师',
  [Role.ADMIN]: '管理员',
  [Role.SUPER_ADMIN]: '超级管理员',
};

module.exports = (...allowedRoles) => {
  return async function roles(ctx, next) {
    // 获取当前用户信息
    const user = ctx.state.user;

    // 检查用户是否已登录
    if (!user || !user.role) {
      ctx.throw(403, '您没有权限访问此资源，请先登录');
    }

    // 如果没有指定所需角色，则允许所有已登录用户访问
    if (!allowedRoles || allowedRoles.length === 0) {
      await next();
      return;
    }

    // 统一转换为大写进行比较
    const userRole = user.role.toUpperCase();
    const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());

    // 检查用户是否有所需的角色
    const hasRole = allowedRolesUpper.includes(userRole);

    if (hasRole) {
      // 直接匹配到所需角色，放行
      await next();
      return;
    }

    // 如果没有直接匹配的角色，检查是否有更高权限
    const userPriority = RolePriority[userRole];
    const requiredPriorities = allowedRolesUpper.map(role => RolePriority[role]);
    const minRequiredPriority = Math.min(...requiredPriorities);

    // 如果用户权限级别大于或等于所需最低权限，则允许访问
    if (userPriority >= minRequiredPriority) {
      await next();
      return;
    }

    // 权限不足，生成友好的错误提示
    const requiredRoleNames = allowedRolesUpper
      .map(role => RoleNames[role] || role)
      .join('或');
    const userRoleName = RoleNames[userRole] || userRole;

    ctx.throw(403, `权限不足，需要 ${requiredRoleNames} 权限，您当前是 ${userRoleName}`);
  };
};
