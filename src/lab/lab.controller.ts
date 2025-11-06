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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { LabService } from './lab.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { SearchLabDto } from './dto/search-lab.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('实验室管理')
@Controller('labs')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建实验室', description: '创建新的实验室' })
  @ApiBody({ type: CreateLabDto })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  create(@Body() createLabDto: CreateLabDto) {
    return this.labService.create(createLabDto);
  }

  @Get()
  @ApiOperation({ summary: '获取实验室列表', description: '查询所有实验室，支持搜索和筛选' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAll(@Query() searchDto: SearchLabDto) {
    return this.labService.findAll(searchDto);
  }

  @Get('popular')
  @ApiOperation({ summary: '获取热门实验室', description: '查询热门实验室列表' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制', example: 6 })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getPopularLabs(@Query('limit') limit?: number) {
    return this.labService.getPopularLabs(limit ? +limit : 6);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取实验室详情', description: '根据ID获取实验室详细信息' })
  @ApiParam({ name: 'id', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id') id: string) {
    return this.labService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新实验室信息', description: '根据ID更新实验室信息' })
  @ApiParam({ name: 'id', description: '实验室ID', example: 'lab-001' })
  @ApiBody({ type: UpdateLabDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  update(@Param('id') id: string, @Body() updateLabDto: UpdateLabDto) {
    return this.labService.update(id, updateLabDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除实验室', description: '根据ID删除实验室' })
  @ApiParam({ name: 'id', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  remove(@Param('id') id: string) {
    return this.labService.remove(id);
  }
}
