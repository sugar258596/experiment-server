import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsIn,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建用户DTO
 */
export class CreateUserDto {
  @ApiProperty({
    description: '用户名，唯一标识',
    example: 'student001',
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @MinLength(4, { message: '用户名长度不能少于4位' })
  @MaxLength(20, { message: '用户名长度不能超过20位' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: '用户名只能包含字母和数字' })
  username: string;

  @ApiProperty({
    description: '用户密码（bcrypt加密）',
    example: 'Password123',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8, { message: '密码长度不能少于8位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码必须包含大小写字母和数字',
  })
  password: string;

  @ApiProperty({
    description: '用户角色',
    enum: ['STUDENT', 'TEACHER', 'ADMIN'],
    example: 'STUDENT',
  })
  @IsIn(['STUDENT', 'TEACHER', 'ADMIN'])
  role: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: '张三',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '昵称长度不能超过50位' })
  nickname?: string;

  @ApiPropertyOptional({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: '用户邮箱',
    example: 'student001@university.edu.cn',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({
    description: '用户手机号',
    example: '13800138000',
  })
  @IsOptional()
  @IsPhoneNumber('CN', { message: '手机号格式不正确' })
  phone?: string;

  @ApiPropertyOptional({
    description: '所属院系/部门',
    example: '计算机科学与技术学院',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '院系名称长度不能超过100位' })
  department?: string;
}
