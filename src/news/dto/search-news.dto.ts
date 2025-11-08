import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/Dto';

export class SearchNewsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  tag?: string;
}
