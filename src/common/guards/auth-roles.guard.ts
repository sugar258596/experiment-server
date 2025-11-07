import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role, RolePriority, RoleLabels, AdminRoles } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtErrorHelper } from '../helpers/jwt-error.helper';

interface JwtPayload {
  sub: number;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    // 公开路由处理
    if (isPublic) {
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token);
          request.user = payload;
        } catch {
          // 公开路由中token无效时不抛出错误，只是不设置user
        }
      }
      return true;
    }

    // 受保护的路由:必须有有效token
    if (!token) {
      throw new UnauthorizedException(
        '请先登录。访问此接口需要身份验证，请在请求头中提供有效的 Authorization token',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch (error) {
      JwtErrorHelper.handleJwtError(error);
    }

    // 检查角色权限
    if (!request.user) {
      throw new UnauthorizedException('用户身份验证失败');
    }
    return this.checkRolePermissions(context, request.user);
  }

  private checkRolePermissions(
    context: ExecutionContext,
    user: JwtPayload,
  ): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置角色要求,允许所有已认证用户访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user || !user.role) {
      throw new ForbiddenException(
        '权限验证失败：无法获取用户角色信息，请重新登录',
      );
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
      this.throwFriendlyForbiddenException(user.role, requiredRoles);
    }

    return hasRole;
  }

  private throwFriendlyForbiddenException(
    Role: Role,
    requiredRoles: Role[],
  ): never {
    const userRoleLabel = RoleLabels[Role] || Role;
    const requiredRoleLabels = requiredRoles
      .map((role) => RoleLabels[role] || role)
      .join('或');

    let message = `权限不足：当前角色为【${userRoleLabel}】，此操作需要【${requiredRoleLabels}】权限`;

    // 根据不同角色给出不同的提示
    if (requiredRoles.some((role) => AdminRoles.includes(role))) {
      message += '。如需访问此功能，请联系系统管理员';
    }

    throw new ForbiddenException(message);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
