import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 信任代理,以便正确获取客户端IP
  app.set('trust proxy', true);

  // 配置Cookie解析
  app.use(cookieParser());

  // 配置Session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key-here',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        httpOnly: true,
        secure: false, // 开发环境设为false,生产环境应该为true
      },
    }),
  );

  // 配置静态资源
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static/',
  });

  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Boss Server API')
    .setDescription('Boss管理系统API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 启用CORS（如果需要）
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger API docs: http://localhost:${port}/api-docs`);
}
void bootstrap();
