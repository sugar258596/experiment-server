import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '../../common/enums/status.enum';

/**
 * 审核仪器使用申请DTO
 */
export class ReviewApplicationDto {
  @ApiProperty({
    description: '审核状态(0-待审核, 1-已通过, 2-已拒绝)',
    enum: ApplicationStatus,
    example: ApplicationStatus.APPROVED,
  })
  @IsEnum(ApplicationStatus, { message: '无效的审核状态' })
  status: ApplicationStatus;

  @ApiPropertyOptional({
    description: '审核意见/拒绝原因',
    example: '申请理由充分，同意使用',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '审核意见不能超过500个字符' })
  reason?: string;
}
