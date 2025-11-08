import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新用户DTO
 * 继承CreateUserDto,所有字段都变为可选
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: '用户状态',
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  status?: string;

  @ApiPropertyOptional({
    description: '教学标签数组',
    example: ['Java', 'Python', '数据结构'],
  })
  teachingTags?: string[];

  @ApiPropertyOptional({
    description: '审核时间段配置(JSON格式)',
    example: {
      morning: ['09:00', '10:00'],
      afternoon: ['14:00', '15:00'],
    },
  })
  auditTimeSlots?: any;
}
