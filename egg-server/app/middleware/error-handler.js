'use strict';

/**
 * 全局错误处理中间件
 * 参考 NestJS 的异常过滤器
 * 统一格式化所有错误响应
 *
 * 错误响应格式:
 * {
 *   code: 400/401/403/404/500...,
 *   data: null,
 *   message: '错误信息'
 * }
 */

// 常见英文错误消息映射表
const errorMessageMap = {
  // 认证相关
  'Unauthorized': '未授权',
  'Token required': '请先登录',
  'Invalid token': 'Token 无效',
  'Token expired': 'Token 已过期',
  'No token provided': '未提供 Token',

  // 权限相关
  'Forbidden': '权限不足',
  'Access denied': '访问被拒绝',
  'Insufficient permissions': '权限不足',

  // 资源相关
  'Not Found': '资源不存在',
  'Resource not found': '资源不存在',

  // 请求相关
  'Bad Request': '请求参数错误',
  'Invalid parameter': '参数无效',
  'Validation Failed': '数据验证失败',

  // 冲突相关
  'Conflict': '资源冲突',
  'Already exists': '资源已存在',
  'Duplicate entry': '数据重复',

  // 服务器相关
  'Internal Server Error': '服务器内部错误',
  'Service Unavailable': '服务暂时不可用',
  'Gateway Timeout': '网关超时',
};

/**
 * 将英文错误消息转换为中文
 * @param {string} message 错误消息
 * @returns {string} 中文错误消息
 */
function translateErrorMessage(message) {
  if (!message) return '未知错误';

  // 完全匹配
  if (errorMessageMap[message]) {
    return errorMessageMap[message];
  }

  // 部分匹配
  for (const [ englishMsg, chineseMsg ] of Object.entries(errorMessageMap)) {
    if (message.includes(englishMsg)) {
      return message.replace(englishMsg, chineseMsg);
    }
  }

  // 如果已经是中文或未匹配到，直接返回
  return message;
}

module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();

      // 处理 404 错误
      if (ctx.status === 404 && !ctx.body) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          data: null,
          message: '请求的资源不存在',
        };
      }
    } catch (err) {
      // 触发 Egg 的错误事件，用于日志记录
      ctx.app.emit('error', err, ctx);

      // 获取 HTTP 状态码
      const status = err.status || 500;

      // 获取错误消息
      let message = err.message || '未知错误';

      // 处理验证错误
      if (err.code === 'invalid_param' || err.name === 'ValidationError') {
        message = '请求参数验证失败';
        if (err.errors && Array.isArray(err.errors)) {
          // 合并多个验证错误
          const errorMessages = err.errors.map(e => e.message || e.field).filter(Boolean);
          if (errorMessages.length > 0) {
            message = errorMessages.join('；');
          }
        }
      }

      // 生产环境隐藏 500 错误的详细信息
      if (status === 500 && ctx.app.config.env === 'prod') {
        message = '服务器内部错误';
      } else {
        // 将英文错误消息转换为中文
        message = translateErrorMessage(message);
      }

      // 设置响应状态码
      ctx.status = status;

      // 统一错误响应格式
      ctx.body = {
        code: status,
        data: null,
        message,
      };
    }
  };
};
