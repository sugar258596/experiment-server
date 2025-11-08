import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

interface ApiResponse<T> {
  code: number;
  data: T | null;
  message: string;
}

/**
 * HTTP异常过滤器(向后兼容,建议使用 AllExceptionsFilter)
 * @deprecated 请使用 AllExceptionsFilter
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: number;

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
        message =
          (responseObj.message as string) ||
          (responseObj.error as string) ||
          '未知错误';

        // 处理验证错误
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        }
      } else {
        message = '未知错误';
      }

      code = status;
    } else {
      // 处理非HTTP异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 500;

      if (exception instanceof Error) {
        message = exception.message;
      } else {
        message = '系统内部错误';
      }
    }

    const errorResponse: ApiResponse<null> = {
      code,
      data: null,
      message,
    };

    // 记录错误日志
    console.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json(errorResponse);
  }
}
