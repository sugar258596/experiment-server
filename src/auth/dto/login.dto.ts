import { IsString, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsBoolean()
  remember?: boolean;
}
