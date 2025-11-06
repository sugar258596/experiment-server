import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfigAsync = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'mysql', //数据库类型
    username: configService.get('DB_USERNAME'), //账号
    password: configService.get('DB_PASSWROD'), //密码
    host: configService.get('DB_HOST'), //host
    port: configService.get('DB_PORT'), // post
    database: configService.get('DB_DATABASE'), //库名
    // entities: [__dirname + '/**/*.entity{.ts,.js}'], //实体文件
    synchronize: false, //synchronize字段代表是否自动将实体类同步到数据库
    retryDelay: 500, //重试连接数据库间隔
    retryAttempts: 10, //重试连接数据库的次数
    autoLoadEntities: true, //自动加载实体
    logging: false, //是否打印日志
    logger: 'advanced-console', //日志类型
    maxQueryExecutionTime: 1000, //查询超时时间
    timezone: '+08:00', //时区
  };
};
