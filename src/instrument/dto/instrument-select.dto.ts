import { PaginationDto } from 'src/common/Dto';

/**
 * 仪器下拉选择查询DTO
 * 继承分页和关键字查询功能，用于获取可用仪器的简化列表（仅返回 id 和 name）
 */
export class InstrumentSelectDto extends PaginationDto {}
