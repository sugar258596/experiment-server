import { IsString, IsInt, IsOptional, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建通知DTO
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: '用户ID（0表示全体用户）',
    example: 1,
  })
  @IsInt({ message: '用户ID必须为整数' })
  @Min(0, { message: '用户ID必须为非负整数（0表示全体用户）' })
  userId: number;

  @ApiProperty({
    description:
      '通知类型:0-预约审核,1-临时通知,2-预约提醒,3-设备申请,4-维修进度',
    example: 0,
  })
  @Type(() => Number)
  @IsInt()
  type: number;

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
