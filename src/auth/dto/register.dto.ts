import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

/**
 * 用户注册DTO
 */
export class RegisterDto {
  @ApiProperty({
    description: '用户名,唯一标识',
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
    description: '用户密码',
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
    description: '确认密码',
    example: 'Password123',
  })
  @IsString()
  @MinLength(8, { message: '确认密码长度不能少于8位' })
  @MaxLength(20, { message: '确认密码长度不能超过20位' })
  confirmPassword: string;

  @ApiProperty({
    description: '用户角色',
    enum: ['STUDENT', 'TEACHER'],
    example: 'STUDENT',
  })
  @Transform(({ value }: { value: unknown }) => {
    // Convert uppercase input to lowercase enum value
    if (typeof value === 'string') {
      return value.toLowerCase() as Role;
    }
    return value as Role;
  })
  @IsIn([Role.STUDENT, Role.TEACHER], { message: '角色只能是STUDENT或TEACHER' })
  role: Role;

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
}
