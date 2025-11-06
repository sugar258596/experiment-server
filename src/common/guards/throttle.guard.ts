import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorMessages } from '../constants/error-messages';

/**
 * 请求限流守卫
 * 简单的内存存储实现，生产环境应使用 Redis
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  private requests: Map<string, number[]> = new Map();
  private readonly ttl = 60000; // 时间窗口 60 秒
  private readonly limit = 100; // 每个时间窗口最多 100 个请求

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();

    // 获取该 key 的请求记录
    const timestamps = this.requests.get(key) || [];

    // 过滤掉过期的时间戳
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.ttl,
    );

    // 检查是否超过限制
    if (validTimestamps.length >= this.limit) {
      throw new HttpException(
        ErrorMessages.SYSTEM.RATE_LIMIT,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 添加当前请求的时间戳
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    // 定期清理过期数据
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    return true;
  }

  /**
   * 生成限流的 key
   * 基于 IP 地址或用户 ID
   */
  private getKey(request: any): string {
    const userId = request.user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    return `ip:${this.getClientIp(request)}`;
  }

  /**
   * 获取客户端 IP
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * 清理过期数据
   */
  private cleanup(now: number): void {
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < this.ttl,
      );
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}
