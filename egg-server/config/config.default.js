'use strict';

const path = require('path');

module.exports = appInfo => {
  const config = exports = {};

  config.keys = appInfo.name + '_1732636800000_1234';

  // 中间件顺序很重要：
  // 1. errorHandler - 错误处理
  // 2. logging - 日志记录
  // 3. responseFormatter - 响应格式化
  // 注意：jwtAuth 不作为全局中间件，而是在路由级别使用
  config.middleware = ['errorHandler', 'logging', 'responseFormatter'];

  config.sequelize = {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_DATABASE || 'experiment_egg',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    timezone: '+08:00',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  };

  config.jwt = {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    // 不设置 match 属性，egg-jwt 插件只提供 jwt.sign/verify 方法，不自动启用中间件
    // 我们使用自定义的 jwt-auth 中间件来控制认证逻辑
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  config.bodyParser = {
    jsonLimit: '10mb',
    formLimit: '10mb',
  };

  config.cluster = {
    listen: {
      port: process.env.PORT || 7001,
    },
  };

  config.swaggerdoc = {
    dirScanner: './app/controller',
    apiInfo: {
      title: 'Egg Lab Server API',
      description: '高校实验室预约管理系统API文档',
      version: '1.0.0',
    },
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      apikey: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: '请输入JWT Token，格式为: Bearer <token>',
      },
    },
    enableSecurity: true,
    routerMap: true,
    enable: true,
  };

  config.multipart = {
    mode: 'file',
    fileSize: '50mb',
    whitelist: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
    ],
    fileExtensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
    ],
    tmpdir: path.join(appInfo.baseDir, 'app/public/temp'),
    cleanSchedule: {
      cron: '0 30 4 * * *',
    },
  };

  config.static = {
    prefix: process.env.SERVET_FILE_STATIC || '/static',
    dir: path.join(appInfo.baseDir, 'app/public'),
    dynamic: true,
    preload: false,
    maxAge: 31536000,
  };

  return {
    ...config,
  };
};
