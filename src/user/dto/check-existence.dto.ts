import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 检查用户名或邮箱是否存在DTO
 */
export class CheckExistenceDto {
  @ApiPropertyOptional({
    description: '用户名（字母和数字组合,4-20位）',
    example: 'student001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '用户名长度不能超过20位' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: '用户名只能包含字母和数字' })
  username?: string;

  @ApiPropertyOptional({
    description: '用户邮箱',
    example: 'student001@university.edu.cn',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}
