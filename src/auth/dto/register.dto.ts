import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+$/)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  confirmPassword: string;

  @IsIn(['STUDENT', 'TEACHER'])
  role: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsPhoneNumber('CN', { message: '手机号格式不正确' })
  phone?: string;
}
