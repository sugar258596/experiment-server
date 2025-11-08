import { IsString, IsEnum, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TimeSlot } from 'src/common/enums/status.enum';

/**
 * 创建预约DTO
 */
export class CreateAppointmentDto {
  @ApiProperty({
    description: '实验室ID',
    example: 1,
  })
  @IsInt({ message: '实验室ID必须为整数' })
  @Min(1, { message: '实验室ID必须为正整数' })
  labId: number;

  @ApiProperty({
    description: '预约日期',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsString()
  appointmentDate: string;

  @ApiProperty({
    description: '时间段',
    enum: TimeSlot,
    example: TimeSlot.MORNING,
  })
  @IsEnum(TimeSlot)
  timeSlot: TimeSlot;

  @ApiProperty({
    description: '预约目的',
    example: '数据结构实验课',
  })
  @IsString()
  @MaxLength(200, { message: '预约目的不能超过200个字符' })
  purpose: string;

  @ApiProperty({
    description: '详细说明',
    example: '需要使用实验室进行二叉树遍历实验，预计50人参与',
  })
  @IsString()
  @MaxLength(1000, { message: '详细说明不能超过1000个字符' })
  description: string;

  @ApiProperty({
    description: '参与人数',
    example: 50,
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: '参与人数至少为1' })
  participantCount: number;
}
