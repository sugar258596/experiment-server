import { Module } from '@nestjs/common';
import { CurrentUserMiddleware } from './current-user.middleware';

@Module({
  providers: [CurrentUserMiddleware],
  exports: [CurrentUserMiddleware],
})
export class MiddlewareModule {}
