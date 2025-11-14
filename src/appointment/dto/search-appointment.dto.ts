import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/Dto';
import { AppointmentStatus } from 'src/common/enums/status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchAppointmentDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '预约状态(0-待审核, 1-已通过, 2-已拒绝, 3-已完成, 4-已取消)',
    enum: AppointmentStatus,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: '实验室ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '实验室ID必须是整数' })
  labId?: number;

  @ApiPropertyOptional({
    description: '用户ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '用户ID必须是整数' })
  userId?: number;

  @ApiPropertyOptional({
    description: '开始日期(YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期(YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '所属院系/部门',
    example: '计算机学院',
  })
  @IsOptional()
  @IsString()
  department?: string;
}
