import {
  Module,
  ValidationPipe,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfigAsync, loadConfig, jwtConfig } from './config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LabModule } from './lab/lab.module';
import { InstrumentModule } from './instrument/instrument.module';
import { AppointmentModule } from './appointment/appointment.module';
import { NewsModule } from './news/news.module';
import { NotificationModule } from './notification/notification.module';
import { FavoritesModule } from './favorites/favorites.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters';
import { AuthRolesGuard } from './common/guards';
import { LoggingInterceptor, ResponseInterceptor } from './common/interceptors';
import { CurrentUserMiddleware } from './common/middleware/current-user.middleware';
import { MiddlewareModule } from './common/middleware/middleware.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      isGlobal: true, //全局
    }),
    JwtModule.register(jwtConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return getDatabaseConfigAsync(configService);
      },
      inject: [ConfigService],
    }),
    MiddlewareModule,
    UserModule,
    AuthModule,
    LabModule,
    InstrumentModule,
    AppointmentModule,
    NewsModule,
    NotificationModule,
    FavoritesModule,
    EvaluationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // 配置全局的验证管道
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true, // 启用自动类型转换
        transformOptions: {
          enableImplicitConversion: true, // 启用隐式类型转换
        },
      }),
    },
    {
      // 全局日志拦截器(先记录请求)
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      // 全局响应拦截器(后格式化响应)
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      // 全局异常过滤器
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      // 全局认证和角色守卫
      provide: APP_GUARD,
      useClass: AuthRolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 对所有需要认证的路径应用当前用户中间件
    // 中间件会在 JwtAuthGuard 之后执行,用于标准化用户信息格式
    consumer
      .apply(CurrentUserMiddleware)
      .forRoutes(
        'user',
        'appointments',
        'instruments',
        'news',
        'notifications',
        'favorites',
        'evaluations',
        'labs',
      );
  }
}
