import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

interface RateLimitInfo {
  count: number;
  firstRequest: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly storage = new Map<string, RateLimitInfo>();
  private readonly maxRequests = 5; // 最大请求次数
  private readonly windowMs = 15 * 60 * 1000; // 15分钟窗口

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientId = this.getClientIdentifier(request);

    if (!clientId) {
      throw new HttpException('无法识别客户端', HttpStatus.TOO_MANY_REQUESTS);
    }

    const now = Date.now();
    const rateLimitInfo = this.storage.get(clientId);

    if (!rateLimitInfo) {
      // 首次请求
      this.storage.set(clientId, {
        count: 1,
        firstRequest: now,
      });
      return true;
    }

    // 检查是否超出时间窗口
    if (now - rateLimitInfo.firstRequest > this.windowMs) {
      // 重置计数器
      this.storage.set(clientId, {
        count: 1,
        firstRequest: now,
      });
      return true;
    }

    // 检查是否超出最大请求数
    if (rateLimitInfo.count >= this.maxRequests) {
      const remainingTime = Math.ceil(
        (this.windowMs - (now - rateLimitInfo.firstRequest)) / 1000 / 60,
      );
      throw new HttpException(
        `请求过于频繁,请 ${remainingTime} 分钟后再试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 增加计数
    rateLimitInfo.count++;
    this.storage.set(clientId, rateLimitInfo);

    return true;
  }

  private getClientIdentifier(request: Request): string | null {
    // 优先使用 IP 地址
    const ip = request.ip || request.connection.remoteAddress;
    if (ip) {
      return `ip_${ip}`;
    }

    // 其次使用 User-Agent 的哈希
    const userAgent = request.headers['user-agent'];
    if (userAgent) {
      return `ua_${this.simpleHash(userAgent)}`;
    }

    return null;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  // 清理过期的记录
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.storage.entries()) {
      if (now - value.firstRequest > this.windowMs) {
        this.storage.delete(key);
      }
    }
  }
}
