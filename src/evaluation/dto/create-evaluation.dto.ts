import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateEvaluationDto {
  @IsUUID()
  labId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  equipmentRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  environmentRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating: number;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  comment?: string;
}
