'use strict';

/**
 * 全局响应格式化中间件
 * 参考 NestJS 的全局响应拦截器
 * 自动统一格式化所有成功的响应
 *
 * 响应格式:
 * {
 *   code: 200,
 *   data: {...} | { list: [], total: number },
 *   message: '操作成功'
 * }
 */
module.exports = () => {
  const DEFAULT_SUCCESS_MESSAGE = '操作成功';

  return async function responseFormatter(ctx, next) {
    await next();

    // 只处理成功的响应 (status 2xx)
    if (ctx.status >= 200 && ctx.status < 300) {
      const response = ctx.body;

      // 1. 处理 null 或 undefined 响应
      if (response === null || response === undefined) {
        ctx.body = {
          code: 200,
          data: response,
          message: DEFAULT_SUCCESS_MESSAGE,
        };
        return;
      }

      // 2. 如果已经是标准格式，直接返回
      if (isApiResponse(response)) {
        return;
      }

      // 3. 处理包含 data 字段的对象响应
      if (hasDataField(response)) {
        // 3.1 data 是对象(非数组)
        if (
          typeof response.data === 'object' &&
          !Array.isArray(response.data)
        ) {
          ctx.body = {
            code: 200,
            data: response.data,
            message: response.message || DEFAULT_SUCCESS_MESSAGE,
          };
          return;
        }

        // 3.2 data 是数组，没有 total
        if (Array.isArray(response.data) && !('total' in response)) {
          ctx.body = {
            code: 200,
            data: {
              list: response.data,
              total: response.data.length,
            },
            message: response.message || DEFAULT_SUCCESS_MESSAGE,
          };
          return;
        }

        // 3.3 data 是数组，有 total
        if (Array.isArray(response.data) && 'total' in response) {
          ctx.body = {
            code: 200,
            data: {
              list: response.data,
              total: response.total,
            },
            message: response.message || DEFAULT_SUCCESS_MESSAGE,
          };
          return;
        }
      }

      // 4. 处理纯数组响应
      if (Array.isArray(response)) {
        ctx.body = {
          code: 200,
          data: {
            list: response,
            total: response.length,
          },
          message: DEFAULT_SUCCESS_MESSAGE,
        };
        return;
      }

      // 5. 默认处理：将响应作为 data 包装
      ctx.body = {
        code: 200,
        data: response,
        message: DEFAULT_SUCCESS_MESSAGE,
      };
    }
  };

  /**
   * 判断是否已经是标准 API 响应格式
   */
  function isApiResponse(response) {
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

  /**
   * 判断响应是否包含 data 字段
   */
  function hasDataField(response) {
    return (
      response &&
      typeof response === 'object' &&
      !Array.isArray(response) &&
      'data' in response &&
      !isApiResponse(response)
    );
  }
};
