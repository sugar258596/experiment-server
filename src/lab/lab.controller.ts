import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
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
import { LabService } from './lab.service';
import { SearchLabDto } from './dto/search-lab.dto';
import { CreateLabFormDto } from './dto/create-lab-form.dto';
import { UpdateLabFormDto } from './dto/update-lab-form.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Public, Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';
import { PaginationDto } from 'src/common/Dto';
import { MultipleImageUpload } from 'src/common/decorators/upload.decorator';

@ApiTags('实验室管理')
@Controller('labs')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 10, 'labs')
  @ApiOperation({
    summary: '创建实验室',
    description: '创建新的实验室(教师及以上权限)，支持上传最多10张图片',
  })
  @ApiBody({
    type: CreateLabFormDto,
    description: '创建实验室表单数据（multipart/form-data）',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  create(
    @Body() createLabFormDto: CreateLabFormDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.labService.createWithFiles(createLabFormDto, files);
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

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 10, 'labs')
  @ApiOperation({
    summary: '更新实验室信息',
    description:
      '根据ID更新实验室信息(教师及以上权限)。图片自动检测模式：1. 仅上传文件 - 替换所有旧图片；2. 上传文件+传入images(旧图URL字符串/数组) - 混合模式，保留指定的旧图片并追加新图片；3. 仅传入images - 保持/调整图片；4. 都不传 - 保持原样',
  })
  @ApiParam({ name: 'id', description: '实验室ID', example: 1 })
  @ApiBody({
    type: UpdateLabFormDto,
    description: '更新实验室表单数据（multipart/form-data）',
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabFormDto: UpdateLabFormDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.labService.updateWithFiles(id, updateLabFormDto, files);
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
