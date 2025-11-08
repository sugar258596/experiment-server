import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
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
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { SearchNewsDto } from './dto/search-news.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Public, Roles } from 'src/common/decorators';
import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('新闻公告')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '发布新闻',
    description: '发布新的实验室新闻公告（教师及以上权限）',
  })
  @ApiBody({ type: CreateNewsDto })
  @ApiResponse({
    status: 201,
    description: '发布成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  create(@Body() createDto: CreateNewsDto, @Req() req: AuthenticatedRequest) {
    return this.newsService.create(createDto, req.user);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '获取新闻列表', description: '查询所有新闻公告' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAll(@Query() searchDto: SearchNewsDto) {
    return this.newsService.findAll(searchDto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取待审核新闻',
    description: '查询待审核的新闻（仅管理员可查看）',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  getPendingNews() {
    return this.newsService.getPendingNews();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: '获取新闻详情',
    description: '根据ID获取新闻详细信息',
  })
  @ApiParam({ name: 'id', description: '新闻ID', example: 'news-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '点赞新闻',
    description: '点赞指定新闻',
  })
  @ApiParam({ name: 'id', description: '新闻ID', example: 'news-001' })
  @ApiResponse({
    status: 200,
    description: '点赞成功',
  })
  like(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.like(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '审核新闻',
    description: '审核新闻发布申请（仅管理员可操作）',
  })
  @ApiParam({ name: 'id', description: '新闻ID', example: 'news-001' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approved: { type: 'boolean', description: '是否通过' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '审核完成',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body('approved') approved: boolean,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.newsService.review(id, approved, req.user);
  }
}
