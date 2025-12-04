'use strict';

/**
 * JWT 认证中间件
 * 参考 NestJS 的 JwtAuthGuard 实现
 * 验证用户的 JWT Token 并将用户信息注入到上下文中
 */

// 公开路由列表(无需认证即可访问)
const publicRoutes = new Set([
  '/api/auth/register',
  '/api/auth/login',
  '/api/labs',
  '/api/labs/popular',
  '/api/labs/options',
  '/api/news',
  '/api/banners',
  '/api/banners/types',
  '/api/appointments',
  '/api/instruments',
  '/api/instruments/options',
  '/api/evaluations',
]);

module.exports = () => {
  return async function jwt(ctx, next) {
    const path = ctx.path;
    const method = ctx.method;

    // 检查是否为公开路由（只对特定的 HTTP 方法开放）
    const isPublic =
      // 明确的公开路由（仅限 GET 方法）
      (method === 'GET' && publicRoutes.has(path)) ||
      // GET 请求的查询接口通常是公开的
      (method === 'GET' && (
        path.startsWith('/api/labs/') ||
        // 新闻相关路由：排除需要权限的路径
        (path.startsWith('/api/news/') &&
          !path.startsWith('/api/news/pending') &&
          !path.startsWith('/api/news/my/')) ||
        path.startsWith('/api/banners/') ||
        // 预约相关路由：排除需要权限的路径
        (path.startsWith('/api/appointments/') &&
          !path.startsWith('/api/appointments/my') &&
          !path.startsWith('/api/appointments/pending')) ||
        // 仪器相关路由：排除需要权限的路径
        (path.startsWith('/api/instruments/') &&
          !path.startsWith('/api/instruments/applications')) ||
        path.startsWith('/api/evaluations/')
      )) ||
      // 认证相关的公开接口（POST 方法）
      (method === 'POST' && (
        path === '/api/auth/register' ||
        path === '/api/auth/login' ||
        path === '/api/auth/logout' ||  // 退出登录不需要验证 token
        path === '/api/user/check-existence'
      ));

    // 公开路由：尝试提取用户信息（如果有token），但不强制要求
    if (isPublic) {
      const authorization = ctx.get('authorization');
      const token = authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const decoded = ctx.app.jwt.verify(token, ctx.app.config.jwt.secret);
          ctx.state.user = decoded;
        } catch (err) {
          // 对于公开路由，token验证失败不抛出错误，只是不设置用户信息
          ctx.state.user = null;
        }
      }

      await next();
      return;
    }

    // 提取 Authorization 头中的 Token
    const authorization = ctx.get('authorization');
    const token = authorization?.replace('Bearer ', '');

    // 检查 Token 是否存在
    if (!token) {
      ctx.throw(401, '您没有权限访问此资源，请先登录');
    }

    // 验证并解码 Token
    try {
      const decoded = ctx.app.jwt.verify(token, ctx.app.config.jwt.secret);
      // 将用户信息注入到上下文中
      ctx.state.user = decoded;
    } catch (err) {
      // Token 验证失败
      if (err.name === 'TokenExpiredError') {
        ctx.throw(401, 'Token 已过期，请重新登录');
      } else if (err.name === 'JsonWebTokenError') {
        ctx.throw(401, 'Token 无效');
      } else {
        ctx.throw(401, `认证失败: ${err.message}`);
      }
    }

    // 继续执行后续中间件（不捕获后续中间件的错误）
    await next();
  };
};
