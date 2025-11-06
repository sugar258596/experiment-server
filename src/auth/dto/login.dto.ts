import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    description: '记住登录状态',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
