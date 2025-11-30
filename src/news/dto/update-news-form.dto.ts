import { PartialType } from '@nestjs/swagger';
import { CreateNewsFormDto } from './create-news-form.dto';

/**
 * 更新新闻表单DTO（支持文件上传）
 * 继承自CreateNewsFormDto，所有字段都是可选的
 */
export class UpdateNewsFormDto extends PartialType(CreateNewsFormDto) {}
