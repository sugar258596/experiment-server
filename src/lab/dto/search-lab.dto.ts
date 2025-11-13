import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LabStatus } from 'src/common/enums/status.enum';
import { PaginationDto } from 'src/common/Dto';

export class SearchLabDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '所属院系/部门',
    example: '物理学院',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: '最小容量',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minCapacity?: number;

  @ApiPropertyOptional({
    description: '最大容量',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: '实验室状态',
    enum: LabStatus,
    example: LabStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(LabStatus)
  status?: LabStatus;
}
