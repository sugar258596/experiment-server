import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, RolePriority } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('您没有权限访问此资源，请先登录');
    }

    // 检查用户是否有所需的角色
    const hasRole = requiredRoles.some((role) => user.role === role);

    // 如果没有直接匹配的角色,检查是否有更高权限
    if (!hasRole) {
      const userPriority = RolePriority[user.role];
      const requiredPriorities = requiredRoles.map(
        (role) => RolePriority[role],
      );
      const minRequiredPriority = Math.min(...requiredPriorities);

      // 如果用户权限级别大于或等于所需最低权限,则允许访问
      if (userPriority >= minRequiredPriority) {
        return true;
      }

      // 权限不足，抛出友好的错误提示
      const roleNames = {
        [Role.SUPER_ADMIN]: '超级管理员',
        [Role.ADMIN]: '管理员',
        [Role.RECRUITER]: '招聘者',
        [Role.JOB_SEEKER]: '求职者',
      };

      const requiredRoleNames = requiredRoles
        .map((role) => roleNames[role])
        .join('或');
      const userRoleName = roleNames[user.role] || user.role;

      throw new ForbiddenException(
        `权限不足，需要 ${requiredRoleNames} 权限，您当前是 ${userRoleName}`,
      );
    }

    return hasRole;
  }
}
