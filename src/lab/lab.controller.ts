import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LabService } from './lab.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { SearchLabDto } from './dto/search-lab.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Public, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';
import { PaginationDto } from 'src/common/Dto';

@ApiTags('实验室管理')
@Controller('labs')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '创建实验室',
    description: '创建新的实验室(教师及以上权限)',
  })
  @ApiBody({ type: CreateLabDto })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  create(@Body() createLabDto: CreateLabDto) {
    return this.labService.create(createLabDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: '获取实验室列表',
    description: '查询所有实验室,支持搜索和筛选',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAll(@Query() searchDto: SearchLabDto) {
    return this.labService.findAll(searchDto);
  }

  @Get('popular')
  @Public()
  @ApiOperation({
    summary: '获取热门实验室',
    description: '查询热门实验室列表',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getPopularLabs(@Query() searchDto: PaginationDto) {
    return this.labService.getPopularLabs(searchDto);
  }

  @Get('options')
  @Public()
  @ApiOperation({
    summary: '获取实验室下拉列表',
    description:
      '获取用于下拉选择的实验室简要信息(仅返回 id 和 name)，支持通过关键字搜索实验室名称、位置、所属院系',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功，返回实验室 id 和 name 列表',
  })
  getOptions(@Query() searchDto: PaginationDto) {
    return this.labService.getOptions(searchDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: '获取实验室详情',
    description: '根据ID获取实验室详细信息',
  })
  @ApiParam({ name: 'id', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.labService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新实验室信息',
    description: '根据ID更新实验室信息(教师及以上权限)',
  })
  @ApiParam({ name: 'id', description: '实验室ID', example: 'lab-001' })
  @ApiBody({ type: UpdateLabDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabDto: UpdateLabDto,
  ) {
    return this.labService.update(id, updateLabDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '删除实验室',
    description: '根据ID删除实验室(仅管理员可操作)',
  })
  @ApiParam({ name: 'id', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.labService.remove(id);
  }
}
