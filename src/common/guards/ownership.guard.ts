import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHECK_OWNERSHIP_KEY,
  OwnershipCheckConfig,
} from '../decorators/check-ownership.decorator';
import { PermissionHelper } from '../helpers/permission.helper';
import { Role, RoleLabels } from '../enums/role.enum';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const ownershipConfig = this.reflector.get<OwnershipCheckConfig>(
      CHECK_OWNERSHIP_KEY,
      context.getHandler(),
    );

    if (!ownershipConfig) {
      return true; // 如果没有配置所有权检查,默认允许访问
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('请先登录后再进行此操作');
    }

    // 检查是否有绕过角色
    if (
      ownershipConfig.bypassRoles &&
      ownershipConfig.bypassRoles.includes(user.role)
    ) {
      return true;
    }

    // 管理员角色默认可以绕过所有权检查
    if (PermissionHelper.isAdmin(user.role)) {
      return true;
    }

    // 获取资源所有者ID
    let resourceOwnerId: number;

    if (ownershipConfig.paramKey) {
      resourceOwnerId = parseInt(request.params[ownershipConfig.paramKey]);
    } else if (ownershipConfig.bodyKey) {
      resourceOwnerId = request.body[ownershipConfig.bodyKey];
    } else {
      // 默认查找 userId 参数
      resourceOwnerId = parseInt(request.params.userId || request.params.id);
    }

    if (!resourceOwnerId) {
      throw new ForbiddenException('无法验证资源所有权:缺少必要的参数');
    }

    // 对于用户资源(如用户头像),直接比较用户ID
    if (ownershipConfig.paramKey === 'userId' || request.params.userId) {
      const hasPermission =
        user.id === resourceOwnerId || PermissionHelper.isAdmin(user.role);
      if (!hasPermission) {
        throw new ForbiddenException(
          '权限不足:您只能操作自己的资源。如需操作其他用户的资源,请联系管理员',
        );
      }
      return true;
    }

    // 对于其他资源,需要从数据库查询实际所有者
    // 这里先简化处理,后续可以根据需要扩展
    const hasPermission = PermissionHelper.checkResourceOwnership(
      user.id,
      resourceOwnerId,
      Role.ADMIN,
      user.role,
    );

    if (!hasPermission) {
      const userRoleLabel = RoleLabels[user.role] || user.role;
      throw new ForbiddenException(
        `权限不足:当前角色【${userRoleLabel}】无权操作此资源。您只能操作属于自己的资源`,
      );
    }

    return true;
  }
}
