import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RepairStatus } from '../../common/enums/status.enum';

/**
 * 更新维修状态DTO
 */
export class UpdateRepairStatusDto {
  @ApiProperty({
    description: '维修状态: 0-待处理, 1-维修中, 2-已完成',
    enum: RepairStatus,
    example: RepairStatus.IN_PROGRESS,
  })
  @IsEnum(RepairStatus, {
    message: '维修状态必须是 0(待处理)、1(维修中) 或 2(已完成)',
  })
  status: RepairStatus;

  @ApiProperty({
    description: '维修总结/备注',
    example: '已更换损坏的显示屏组件，测试正常',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '维修总结不能超过500个字符' })
  summary?: string;
}
