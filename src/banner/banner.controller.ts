import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { CreateBannerTypeDto } from './dto/create-banner-type.dto';
import { UpdateBannerTypeDto } from './dto/update-banner-type.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Public, Roles } from '../common/decorators';
import { Role } from '../common/enums/role.enum';
import { MultipleImageUpload } from '../common/decorators/upload.decorator';

@ApiTags('轮播图管理')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  // ==================== 轮播图类型相关接口 ====================

  @Post('types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '创建轮播图类型',
    description: '创建新的轮播图类型（管理员及以上权限）',
  })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  createType(@Body() createBannerTypeDto: CreateBannerTypeDto) {
    return this.bannerService.createType(createBannerTypeDto);
  }

  @Get('types')
  @Public()
  @ApiOperation({
    summary: '获取所有轮播图类型',
    description: '查询所有轮播图类型列表',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAllTypes() {
    return this.bannerService.findAllTypes();
  }

  @Get('types/:id')
  @Public()
  @ApiOperation({
    summary: '获取轮播图类型详情',
    description: '根据ID获取轮播图类型详细信息',
  })
  @ApiParam({ name: 'id', description: '轮播图类型ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiResponse({
    status: 404,
    description: '类型不存在',
  })
  findOneType(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOneType(id);
  }

  @Post('types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新轮播图类型',
    description: '根据ID更新轮播图类型信息（管理员及以上权限）',
  })
  @ApiParam({ name: 'id', description: '轮播图类型ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  @ApiResponse({
    status: 404,
    description: '类型不存在',
  })
  updateType(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBannerTypeDto: UpdateBannerTypeDto,
  ) {
    return this.bannerService.updateType(id, updateBannerTypeDto);
  }

  @Delete('types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '删除轮播图类型',
    description: '根据ID删除轮播图类型（软删除，管理员及以上权限）',
  })
  @ApiParam({ name: 'id', description: '轮播图类型ID', example: 1 })
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
    description: '类型不存在',
  })
  removeType(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.removeType(id);
  }

  // ==================== 轮播图相关接口 ====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 10, 'banners')
  @ApiOperation({
    summary: '创建轮播图',
    description: '创建新的轮播图（管理员及以上权限），支持上传最多10张图片',
  })
  @ApiBody({
    type: CreateBannerDto,
    description: '创建轮播图表单数据（multipart/form-data）',
  })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  @ApiResponse({
    status: 404,
    description: '轮播图类型不存在',
  })
  createBanner(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.bannerService.createBanner(createBannerDto, files);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: '获取轮播图列表',
    description: '查询所有轮播图，支持按类型筛选',
  })
  @ApiQuery({
    name: 'typeId',
    description: '轮播图类型ID（可选）',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAllBanners(
    @Query('typeId', new ParseIntPipe({ optional: true })) typeId?: number,
  ) {
    return this.bannerService.findAllBanners(typeId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: '获取轮播图详情',
    description: '根据ID获取轮播图详细信息',
  })
  @ApiParam({ name: 'id', description: '轮播图ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiResponse({
    status: 404,
    description: '轮播图不存在',
  })
  findOneBanner(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOneBanner(id);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 10, 'banners')
  @ApiOperation({
    summary: '更新轮播图信息',
    description:
      '根据ID更新轮播图信息（管理员及以上权限）。图片自动检测模式：1. 仅上传文件 - 替换所有旧图片；2. 上传文件+传入images(旧图URL字符串/数组) - 混合模式，保留指定的旧图片并追加新图片；3. 仅传入images - 保持/调整图片；4. 都不传 - 保持原样',
  })
  @ApiParam({ name: 'id', description: '轮播图ID', example: 1 })
  @ApiBody({
    type: UpdateBannerDto,
    description: '更新轮播图表单数据（multipart/form-data）',
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  @ApiResponse({
    status: 404,
    description: '轮播图或类型不存在',
  })
  updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBannerDto: UpdateBannerDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.bannerService.updateBanner(id, updateBannerDto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '删除轮播图',
    description: '根据ID删除轮播图（软删除，管理员及以上权限）',
  })
  @ApiParam({ name: 'id', description: '轮播图ID', example: 1 })
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
    description: '轮播图不存在',
  })
  removeBanner(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.removeBanner(id);
  }
}
