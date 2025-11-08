import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

/**
 * 创建通知DTO
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  @IsInt({ message: '用户ID必须为整数' })
  @Min(1, { message: '用户ID必须为正整数' })
  userId: number;

  @ApiProperty({
    description: '通知类型',
    enum: NotificationType,
    example: NotificationType.APPOINTMENT_REVIEW,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '通知标题',
    example: '预约已通过审核',
  })
  @IsString()
  @MaxLength(100, { message: '通知标题不能超过100个字符' })
  title: string;

  @ApiProperty({
    description: '通知内容',
    example: '您的实验室预约已通过审核,请按时到场',
  })
  @IsString()
  @MaxLength(500, { message: '通知内容不能超过500个字符' })
  content: string;

  @ApiProperty({
    description: '相关记录ID(可选)',
    example: 'appointment-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedId?: string;
}
