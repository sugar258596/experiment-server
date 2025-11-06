import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { MiddlewareModule } from './middleware/middleware.module';

@Module({
  imports: [JwtModule.register(jwtConfig), MiddlewareModule],
  providers: [JwtAuthGuard, AuthRolesGuard],
  exports: [JwtModule, JwtAuthGuard, AuthRolesGuard, MiddlewareModule],
})
export class CommonModule {}
