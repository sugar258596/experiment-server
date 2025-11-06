import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from '../utils/logger.util';
import {
  AuthenticatedRequest,
  OptionalAuthRequest,
} from '../interfaces/request.interface';

/**
 * 日志拦截器
 * 记录所有 API 请求和响应时间
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest | OptionalAuthRequest>();
    const { method, url, user } = request;
    const startTime = Date.now();

    // 记录请求日志
    AppLogger.logRequest(method, url, user?.id);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        AppLogger.debug(
          `${method} ${url} - 响应时间: ${responseTime}ms`,
          'API',
        );
      }),
    );
  }
}
