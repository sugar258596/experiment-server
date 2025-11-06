import {
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  IsUrl,
} from 'class-validator';
import { LabStatus } from '../entities/lab.entity';

export class CreateLabDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsEnum(LabStatus)
  @IsOptional()
  status?: LabStatus;

  @IsString()
  department: string;

  @IsArray()
  @IsOptional()
  equipmentList?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];
}
