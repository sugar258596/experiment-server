import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { jwtConfig } from '../config';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
