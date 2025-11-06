import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLogger } from '../utils/logger.util';
import { ErrorMessages } from '../constants/error-messages';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准格式的错误响应
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ErrorMessages.SYSTEM.INTERNAL_ERROR;
    let errorDetail: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        errorDetail = responseObj.error as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message || ErrorMessages.SYSTEM.INTERNAL_ERROR;
      errorDetail = exception.stack;
    }

    // 记录错误日志
    AppLogger.logError(
      exception instanceof Error ? exception : new Error(String(exception)),
      'ExceptionFilter',
      {
        url: request.url,
        method: request.method,
        status,
        user: request.user?.id,
      },
    );

    // 返回统一格式的错误响应
    response.status(status).json({
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV === 'development' &&
        errorDetail && { error: errorDetail }),
    });
  }
}
