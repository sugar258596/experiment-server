import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MaxLength,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { Status } from '../../common/enums/status.enum';

/**
 * 管理员更新用户信息DTO
 * 管理员可以修改用户的角色、状态以及所有基本信息
 * 但不能修改密码（密码应该通过专门的密码修改接口）
 */
export class UpdateUserByAdminDto {
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
    description: '用户角色',
    enum: Role,
    example: Role.STUDENT,
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色值不合法' })
  role?: Role;

  @ApiPropertyOptional({
    description: '用户状态',
    enum: Status,
    example: Status.ACTIVE,
  })
  @IsOptional()
  @IsEnum(Status, { message: '状态值不合法' })
  status?: Status;

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
