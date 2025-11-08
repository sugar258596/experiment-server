import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { JwtErrorHelper } from '../helpers/jwt-error.helper';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否标记为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (isPublic) {
      // 公开路由:如果有token就验证并设置用户信息,没有token就忽略
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token);
          // 标准化user对象：将sub转换为id
          const user = {
            id: payload.sub,
            username: payload.username,
            email: payload.email || '',
            role: payload.role,
            status: payload.status !== undefined ? payload.status : 1,
          };
          request['user'] = user;
        } catch (error) {
          // 公开路由中token无效时不抛出错误,只是不设置user
        }
      }
      return true;
    }

    // 受保护的路由:必须有有效token
    if (!token) {
      throw new UnauthorizedException('未提供身份验证令牌,请先登录');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // 标准化user对象：将sub转换为id
      const user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email || '',
        role: payload.role,
        status: payload.status !== undefined ? payload.status : 1,
      };
      request['user'] = user;
    } catch (error) {
      JwtErrorHelper.handleJwtError(error);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
