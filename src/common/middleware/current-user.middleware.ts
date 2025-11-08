import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '../interfaces/request.interface';
import { Role } from '../enums/role.enum';

// JWT payload 接口定义
interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  email?: string;
  status?: number;
}

interface RequestWithUser extends Request {
  user?: JwtPayload | UserPayload;
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    // 如果请求中已经有用户信息（通过 JwtAuthGuard 设置），则标准化为 UserPayload 格式
    if (req.user) {
      const jwtPayload = req.user as JwtPayload;

      // 转换 JWT payload 为标准的 UserPayload 格式
      // 检查是否已经是UserPayload格式（有id字段）
      const hasIdField = 'id' in jwtPayload;

      if (!hasIdField && jwtPayload.sub) {
        const userPayload: UserPayload = {
          id: jwtPayload.sub,
          username: jwtPayload.username,
          email: jwtPayload.email || '', // JWT 中可能没有 email，使用空字符串
          role: jwtPayload.role as Role, // 类型断言为 Role 枚举
          status: jwtPayload.status !== undefined ? jwtPayload.status : 1, // 默认状态为激活
        };

        req.user = userPayload;
      }
    }

    next();
  }
}
