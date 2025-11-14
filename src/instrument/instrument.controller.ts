import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InstrumentService } from './instrument.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { ApplyInstrumentDto } from './dto/apply-instrument.dto';
import { ReportInstrumentDto } from './dto/report-instrument.dto';
import { QueryInstrumentDto } from './dto/query-instrument.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { QueryMyApplicationDto } from './dto/query-my-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { InstrumentSelectDto } from './dto/instrument-select.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Public, Roles } from 'src/common/decorators';
import { MultipleImageUpload } from 'src/common/decorators/upload.decorator';

import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('仪器管理')
@Controller('instruments')
export class InstrumentController {
  constructor(private readonly instrumentService: InstrumentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 10, 'instruments')
  @ApiOperation({
    summary: '创建仪器',
    description: '添加新的仪器设备(教师及以上权限)，支持上传最多10张图片',
  })
  @ApiBody({
    type: CreateInstrumentDto,
    description: '创建仪器表单数据（multipart/form-data）',
  })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  create(
    @Body() createInstrumentDto: CreateInstrumentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.instrumentService.createWithFiles(createInstrumentDto, files);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: '获取仪器列表',
    description:
      '查询所有仪器设备，支持关键词搜索、实验室ID筛选、状态筛选和分页',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功，返回分页数据',
    schema: {
      type: 'object',
    },
  })
  findAll(@Query() query: QueryInstrumentDto) {
    return this.instrumentService.findAll(query);
  }

  @Get('options')
  @Public()
  @ApiOperation({
    summary: '获取仪器下拉选择列表',
    description:
      '获取可用仪器的下拉列表（仅返回id和name），仅包含正常状态的仪器，支持关键词搜索和分页',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功，返回仪器下拉列表',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '电子显微镜' },
            },
          },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        pageSize: { type: 'number', example: 10 },
      },
    },
  })
  getInstrumentSelect(@Query() query: InstrumentSelectDto) {
    return this.instrumentService.getInstrumentSelect(query);
  }

  @Get('applications/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取我的申请列表',
    description:
      '查询当前登录用户的仪器使用申请，支持关键词搜索、状态筛选和分页',
  })
  getMyApplications(
    @Query() query: QueryMyApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.instrumentService.getMyApplications(req.user.id, query);
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取使用申请列表',
    description:
      '查询仪器使用申请(教师及以上权限)，支持关键词搜索、仪器ID筛选、申请人ID筛选、状态筛选和分页',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  getApplications(@Query() query: QueryApplicationDto) {
    return this.instrumentService.getApplications(query);
  }

  @Get('repairs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取维修记录',
    description: '查询仪器维修记录(仅管理员可查看)',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  getRepairs() {
    return this.instrumentService.getRepairs();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: '获取仪器详情',
    description: '根据ID获取仪器详细信息',
  })
  @ApiParam({ name: 'id', description: '仪器ID', example: 'instrument-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instrumentService.findOne(id);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 10, 'instruments')
  @ApiOperation({
    summary: '更新仪器信息',
    description:
      '根据ID更新仪器信息(教师及以上权限)。images字段：上传文件则删除旧图片并使用新图片；传入JSON字符串则保持原有图片',
  })
  @ApiParam({ name: 'id', description: '仪器ID', example: 1 })
  @ApiBody({
    type: UpdateInstrumentDto,
    description: '更新仪器表单数据（multipart/form-data）',
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstrumentDto: UpdateInstrumentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.instrumentService.updateWithFiles(
      id,
      updateInstrumentDto,
      files,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '删除仪器',
    description: '根据ID删除仪器设备(仅管理员可操作)，使用软删除',
  })
  @ApiParam({ name: 'id', description: '仪器ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  @ApiResponse({
    status: 404,
    description: '仪器不存在',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.instrumentService.remove(id);
  }

  @Post('apply/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '申请使用仪器',
    description: '申请使用指定的仪器设备',
  })
  @ApiParam({ name: 'id', description: '仪器ID', example: 'instrument-001' })
  @ApiBody({ type: ApplyInstrumentDto })
  @ApiResponse({
    status: 201,
    description: '申请提交成功',
  })
  apply(
    @Param('id', ParseIntPipe) id: number,
    @Body() applyDto: ApplyInstrumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.instrumentService.apply(id, req.user, applyDto);
  }

  @Post('applications/review/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '审核使用申请',
    description: '审核仪器使用申请(仅教师和管理员可操作)',
  })
  @ApiParam({ name: 'id', description: '申请ID', example: 1 })
  @ApiBody({ type: ReviewApplicationDto })
  @ApiResponse({
    status: 200,
    description: '审核完成',
  })
  @ApiResponse({
    status: 400,
    description: '无效的审核状态或申请不存在',
  })
  reviewApplication(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.instrumentService.reviewApplication(id, req.user, reviewDto);
  }

  @Post('repair/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '报告仪器故障',
    description: '报告仪器设备故障并申请维修',
  })
  @ApiParam({ name: 'id', description: '仪器ID', example: 'instrument-001' })
  @ApiBody({ type: ReportInstrumentDto })
  @ApiResponse({
    status: 201,
    description: '报告提交成功',
  })
  report(
    @Param('id', ParseIntPipe) id: number,
    @Body() reportDto: ReportInstrumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.instrumentService.report(id, req.user, reportDto);
  }

  @Post('repairs/update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新维修状态',
    description: '更新仪器维修状态(仅管理员可操作)',
  })
  @ApiParam({ name: 'id', description: '维修记录ID', example: 1 })
  @ApiBody({ type: UpdateRepairStatusDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  updateRepairStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRepairStatusDto,
  ) {
    return this.instrumentService.updateRepairStatus(
      id,
      updateDto.status,
      updateDto.summary,
    );
  }
}
