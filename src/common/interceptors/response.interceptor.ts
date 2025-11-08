import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiListResponse, ApiResponse, PaginatedResponse } from './type';

/**
 * 统一响应拦截器
 */
@Injectable()
export class ResponseInterceptor<T>
  implements
    NestInterceptor<T, ApiResponse<PaginatedResponse<T>> | ApiListResponse<T>>
{
  private readonly DEFAULT_SUCCESS_MESSAGE = '操作成功';

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<PaginatedResponse<T>> | ApiListResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // 1. 处理 null 或 undefined 响应
        if (response === null || response === undefined) {
          return {
            code: 200,
            data: response,
            message: this.DEFAULT_SUCCESS_MESSAGE,
          };
        }

        // 2. 如果已经是标准格式,直接返回
        if (this.isApiResponse(response)) {
          return response;
        }

        // 3. 处理包含 data 字段的对象响应
        if (this.hasDataField(response)) {
          // 3.1 data 是对象（非数组）
          if (
            typeof response.data === 'object' &&
            !Array.isArray(response.data)
          ) {
            return {
              code: 200,
              data: response.data,
              message: response.message || this.DEFAULT_SUCCESS_MESSAGE,
            };
          }

          // 3.2 data 是数组,没有 total
          if (Array.isArray(response.data) && !('total' in response)) {
            return {
              code: 200,
              data: {
                list: response.data,
                total: response.data.length,
              },
              message: this.DEFAULT_SUCCESS_MESSAGE,
            };
          }

          // 3.3 data 是数组,有 total
          if (Array.isArray(response.data) && 'total' in response) {
            return {
              code: 200,
              data: {
                list: response.data,
                total: response.total,
              },
              message: this.DEFAULT_SUCCESS_MESSAGE,
            };
          }
        }

        // 4. 处理纯数组响应
        if (Array.isArray(response)) {
          return {
            code: 200,
            data: {
              list: response,
              total: response.length,
            },
            message: this.DEFAULT_SUCCESS_MESSAGE,
          };
        }

        // 5. 默认处理：将响应作为 data 包装
        return {
          code: 200,
          data: response,
          message: this.DEFAULT_SUCCESS_MESSAGE,
        };
      }),
    );
  }

  private isApiResponse(
    response: any,
  ): response is ApiResponse<T> | ApiListResponse<T> {
    return (
      response &&
      typeof response === 'object' &&
      'code' in response &&
      'data' in response &&
      'message' in response &&
      typeof response.code === 'number' &&
      typeof response.message === 'string'
    );
  }

  private hasDataField(response: any): boolean {
    return (
      response &&
      typeof response === 'object' &&
      !Array.isArray(response) &&
      'data' in response &&
      !this.isApiResponse(response)
    );
  }
}
