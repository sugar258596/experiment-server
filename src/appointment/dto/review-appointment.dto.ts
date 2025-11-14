import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../common/enums/status.enum';

export class ReviewAppointmentDto {
  @ApiProperty({
    description: '审核状态: 1-已通过, 2-已拒绝',
    example: AppointmentStatus.APPROVED,
    enum: AppointmentStatus,
  })
  @IsEnum(AppointmentStatus, {
    message: '审核状态必须是 1(已通过) 或 2(已拒绝)',
  })
  status: AppointmentStatus;

  @ApiProperty({
    description: '审核意见',
    example: '预约时间合理，批准使用',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
