import { PartialType } from '@nestjs/swagger';
import { CreateBannerTypeDto } from './create-banner-type.dto';

/**
 * 更新轮播图类型 DTO
 */
export class UpdateBannerTypeDto extends PartialType(CreateBannerTypeDto) {}
