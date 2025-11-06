import { IsOptional, IsString } from 'class-validator';

export class SearchNewsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
