import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfigAsync = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const env = process.env.NODE_ENV || 'development';

  // 如果环境变量USE_SQLITE为true，使用SQLite
  if (process.env.USE_SQLITE === 'true') {
    return {
      type: 'sqlite',
      database: ':memory:', // 使用内存数据库进行测试
      synchronize: true,
      autoLoadEntities: true,
      logging: false,
    } as TypeOrmModuleOptions;
  }

  return {
    type: 'mysql', //数据库类型
    username: configService.get('DB_USERNAME'), //账号
    password: configService.get('DB_PASSWORD'), //密码（修复拼写错误）
    host: configService.get('DB_HOST'), //host
    port: configService.get('DB_PORT'), // post
    database: configService.get('DB_DATABASE'), //库名
    // entities: [__dirname + '/**/*.entity{.ts,.js}'], //实体文件
    synchronize: env === 'development' || env === 'test', //开发和测试环境自动同步
    retryDelay: 500, //重试连接数据库间隔
    retryAttempts: 10, //重试连接数据库的次数
    autoLoadEntities: true, //自动加载实体
    logging: false, //是否打印日志
    logger: 'advanced-console', //日志类型
    maxQueryExecutionTime: 1000, //查询超时时间
    timezone: '+08:00', //时区
  };
};
