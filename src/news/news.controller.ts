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
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { SearchNewsDto } from './dto/search-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateNewsDto, @Req() req: any) {
    return this.newsService.create(createDto, req.user);
  }

  @Get()
  findAll(@Query() searchDto: SearchNewsDto) {
    return this.newsService.findAll(searchDto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  getPendingNews() {
    return this.newsService.getPendingNews();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string) {
    return this.newsService.like(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard)
  review(@Param('id') id: string, @Body('approved') approved: boolean) {
    return this.newsService.review(id, approved);
  }
}
