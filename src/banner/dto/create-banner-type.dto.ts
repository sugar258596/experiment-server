import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { BaseStatus } from '../../common/enums/status.enum';

/**
 * 创建轮播图类型 DTO
 */
export class CreateBannerTypeDto {
  @ApiProperty({ description: '类型名称', example: '首页轮播' })
  @IsString()
  name: string;

  @ApiProperty({ description: '类型描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '状态：0-启用，1-禁用',
    enum: BaseStatus,
    default: BaseStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(BaseStatus)
  status?: BaseStatus;
}
