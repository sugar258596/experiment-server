import { PartialType } from '@nestjs/mapped-types';
import { CreateLabDto } from './create-lab.dto';

/**
 * 更新实验室DTO
 * 继承CreateLabDto，所有字段都变为可选
 */
export class UpdateLabDto extends PartialType(CreateLabDto) {}
