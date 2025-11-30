import { PartialType } from '@nestjs/swagger';
import { CreateNewsDto } from './create-news.dto';

/**
 * 更新新闻公告DTO
 * 继承自CreateNewsDto，所有字段都是可选的
 */
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
