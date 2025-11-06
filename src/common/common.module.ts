import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRolesGuard } from './guards/auth-roles.guard';

@Module({
  imports: [JwtModule.register(jwtConfig)],
  providers: [JwtAuthGuard, AuthRolesGuard],
  exports: [JwtModule, JwtAuthGuard, AuthRolesGuard],
})
export class CommonModule {}
