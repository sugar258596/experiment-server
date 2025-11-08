import { UnauthorizedException } from '@nestjs/common';

export class JwtErrorHelper {
  /**
   * 处理JWT验证错误,提供友好的错误提示
   */
  static handleJwtError(error: any): never {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('您的登录已过期,请重新登录以继续操作');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('身份验证令牌无效,请重新登录');
    }
    if (error.name === 'NotBeforeError') {
      throw new UnauthorizedException('身份验证令牌尚未生效,请稍后重试');
    }
    throw new UnauthorizedException('身份验证失败,请重新登录');
  }
}
