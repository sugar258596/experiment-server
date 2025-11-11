import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MaxLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 更新个人信息DTO
 * 用户只能修改自己的基本信息，不能修改角色和密码
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '用户昵称',
    example: '张三',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '昵称长度不能超过50位' })
  nickname?: string;

  @ApiPropertyOptional({
    description: '用户头像URL或上传文件',
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
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '院系名称长度不能超过100位' })
  department?: string;

  @ApiPropertyOptional({
    description: '教学标签数组',
    example: ['Java', 'Python', '数据结构'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }: { value: string | string[] }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);
    }
    return value;
  })
  teachingTags?: string[];
}
