import { ForbiddenException } from '@nestjs/common';
import { Role, RolePriority } from '../enums/role.enum';

export class PermissionHelper {
  /**
   * 检查用户是否有指定角色
   */
  static hasRole(Role: Role, requiredRole: Role): boolean {
    return Role === requiredRole;
  }

  /**
   * 检查用户是否有足够权限（权限级别）
   */
  static hasPermission(Role: Role, requiredRole: Role): boolean {
    const userPriority = RolePriority[Role];
    const requiredPriority = RolePriority[requiredRole];
    return userPriority >= requiredPriority;
  }

  /**
   * 检查用户是否有任意一个指定角色
   */
  static hasAnyRole(Role: Role, requiredRoles: Role[]): boolean {
    return requiredRoles.includes(Role);
  }

  /**
   * 检查用户是否有足够权限访问任意一个指定角色的资源
   */
  static hasAnyPermission(Role: Role, requiredRoles: Role[]): boolean {
    const userPriority = RolePriority[Role];
    const requiredPriorities = requiredRoles.map((role) => RolePriority[role]);
    const minRequiredPriority = Math.min(...requiredPriorities);
    return userPriority >= minRequiredPriority;
  }

  /**
   * 检查用户是否可以操作目标用户（权限级别必须高于目标用户）
   */
  static canManageUser(currentUserRole: Role, targetUserRole: Role): boolean {
    const currentPriority = RolePriority[currentUserRole];
    const targetPriority = RolePriority[targetUserRole];
    return currentPriority > targetPriority;
  }

  /**
   * 检查用户是否可以修改目标用户（权限级别必须高于或等于目标用户,但不能是同一个用户）
   */
  static canModifyUser(
    currentUserRole: Role,
    targetUserRole: Role,
    currentUserId: number,
    targetUserId: number,
  ): boolean {
    // 可以修改自己的信息
    if (currentUserId === targetUserId) {
      return true;
    }

    // 或者权限级别高于目标用户
    return this.canManageUser(currentUserRole, targetUserRole);
  }

  /**
   * 抛出权限不足异常
   */
  static throwForbidden(message = '权限不足'): never {
    throw new ForbiddenException(message);
  }

  /**
   * 检查资源所有权
   */
  static checkResourceOwnership(
    currentUserId: number,
    resourceOwnerId: number,
    requiredRole?: Role,
    currentUserRole?: Role,
  ): boolean {
    // 如果是资源所有者,允许访问
    if (currentUserId === resourceOwnerId) {
      return true;
    }

    // 如果指定了所需角色和当前用户角色,检查权限
    if (requiredRole && currentUserRole) {
      return this.hasPermission(currentUserRole, requiredRole);
    }

    return false;
  }

  /**
   * 获取角色的中文描述
   */
  static getRoleDescription(role: Role): string {
    const descriptions = {
      [Role.SUPER_ADMIN]: '超级管理员',
      [Role.ADMIN]: '管理员',
      [Role.TEACHER]: '招聘者',
      [Role.STUDENT]: '求职者',
    };
    return descriptions[role] || '未知角色';
  }

  /**
   * 检查是否为管理员角色
   */
  static isAdmin(role: Role): boolean {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }

  /**
   * 检查是否为超级管理员
   */
  static isSuperAdmin(role: Role): boolean {
    return role === Role.SUPER_ADMIN;
  }

  /**
   * 检查是否为普通用户角色
   */
  static isRegularUser(role: Role): boolean {
    return role === Role.STUDENT || role === Role.TEACHER;
  }
}
