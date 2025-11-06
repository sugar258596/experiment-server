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
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { SearchNewsDto } from './dto/search-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('新闻公告')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布新闻', description: '发布新的实验室新闻公告' })
  @ApiBody({ type: CreateNewsDto })
  @ApiResponse({
    status: 201,
    description: '发布成功',
  })
  create(@Body() createDto: CreateNewsDto, @Req() req: any) {
    return this.newsService.create(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取新闻列表', description: '查询所有新闻公告' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAll(@Query() searchDto: SearchNewsDto) {
    return this.newsService.findAll(searchDto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取待审核新闻',
    description: '查询待审核的新闻（仅管理员可查看）',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getPendingNews() {
    return this.newsService.getPendingNews();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取新闻详情', description: '根据ID获取新闻详细信息' })
  @ApiParam({ name: 'id', description: '新闻ID', example: 'news-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id') id: string) {
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
  like(@Param('id') id: string) {
    return this.newsService.like(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard)
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
  review(@Param('id') id: string, @Body('approved') approved: boolean) {
    return this.newsService.review(id, approved);
  }
}
