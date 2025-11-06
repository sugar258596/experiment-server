import { Logger } from '@nestjs/common';

/**
 * 统一日志工具类
 * 用于记录应用程序日志
 */
export class AppLogger {
  private static loggers: Map<string, Logger> = new Map();

  static getLogger(context: string): Logger {
    if (!this.loggers.has(context)) {
      this.loggers.set(context, new Logger(context));
    }
    return this.loggers.get(context)!;
  }

  static log(message: string, context: string = 'Application') {
    this.getLogger(context).log(message);
  }

  static error(
    message: string,
    trace?: string,
    context: string = 'Application',
  ) {
    this.getLogger(context).error(message, trace);
  }

  static warn(message: string, context: string = 'Application') {
    this.getLogger(context).warn(message);
  }

  static debug(message: string, context: string = 'Application') {
    this.getLogger(context).debug(message);
  }

  static verbose(message: string, context: string = 'Application') {
    this.getLogger(context).verbose(message);
  }

  /**
   * 记录数据库查询日志
   */
  static logQuery(
    query: string,
    parameters?: unknown[],
    context: string = 'Database',
  ) {
    if (process.env.NODE_ENV === 'development') {
      this.debug(`Query: ${query}`, context);
      if (parameters) {
        this.debug(`Parameters: ${JSON.stringify(parameters)}`, context);
      }
    }
  }

  /**
   * 记录 API 请求日志
   */
  static logRequest(
    method: string,
    url: string,
    userId?: number,
    context: string = 'API',
  ) {
    const userInfo = userId ? `[User:${userId}]` : '[Anonymous]';
    this.log(`${userInfo} ${method} ${url}`, context);
  }

  /**
   * 记录错误详情
   */
  static logError(
    error: Error,
    context: string = 'Error',
    additionalInfo?: Record<string, unknown>,
  ) {
    this.error(`错误: ${error.message}`, error.stack, context);
    if (additionalInfo) {
      this.error(
        `附加信息: ${JSON.stringify(additionalInfo)}`,
        undefined,
        context,
      );
    }
  }
}
