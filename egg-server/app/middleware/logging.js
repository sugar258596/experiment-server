'use strict';

/**
 * 日志记录中间件
 * 参考 NestJS 的 LoggingInterceptor 实现
 * 记录所有 API 请求、响应时间和用户信息
 */

module.exports = () => {
  return async function logging(ctx, next) {
    const { method, url } = ctx.request;
    const startTime = Date.now();

    // 获取用户ID的辅助函数
    const getUserId = () => {
      const user = ctx.state.user;
      return user?.sub || user?.id || '未登录';
    };

    try {
      // 继续执行后续中间件
      await next();

      // 计算响应时间
      const responseTime = Date.now() - startTime;
      const status = ctx.status;

      // 记录请求完成日志（此时 JWT 已解析，可以获取到正确的用户ID）
      ctx.logger.info(
        `[请求完成] ${method} ${url} - 状态码: ${status} - 响应时间: ${responseTime}ms - 用户ID: ${getUserId()}`
      );
    } catch (error) {
      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 记录错误日志
      ctx.logger.error(
        `[请求失败] ${method} ${url} - 错误: ${error.message} - 响应时间: ${responseTime}ms - 用户ID: ${getUserId()}`,
        error.stack
      );

      // 重新抛出错误，让错误处理中间件处理
      throw error;
    }
  };
};
