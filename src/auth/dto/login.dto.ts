import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户登录DTO
 */
export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'student001',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: '用户密码',
    example: 'Password123',
  })
  @IsString()
  password: string;
}
