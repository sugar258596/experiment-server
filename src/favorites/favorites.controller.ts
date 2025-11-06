import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('我的收藏')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':labId')
  @ApiOperation({
    summary: '添加收藏',
    description: '将实验室添加到我的收藏',
  })
  @ApiParam({ name: 'labId', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 201,
    description: '收藏成功',
  })
  add(@Param('labId') labId: string, @Req() req: any) {
    return this.favoritesService.add(req.user.id, labId);
  }

  @Delete(':labId')
  @ApiOperation({
    summary: '取消收藏',
    description: '从我的收藏中移除实验室',
  })
  @ApiParam({ name: 'labId', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '取消成功',
  })
  remove(@Param('labId') labId: string, @Req() req: any) {
    return this.favoritesService.remove(req.user.id, labId);
  }

  @Get()
  @ApiOperation({
    summary: '获取我的收藏',
    description: '查询当前用户收藏的所有实验室',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getMyFavorites(@Req() req: any) {
    return this.favoritesService.getMyFavorites(req.user.id);
  }

  @Get(':labId/check')
  @ApiOperation({
    summary: '检查是否收藏',
    description: '检查指定实验室是否已收藏',
  })
  @ApiParam({ name: 'labId', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  isFavorited(@Param('labId') labId: string, @Req() req: any) {
    return this.favoritesService.isFavorited(req.user.id, labId);
  }
}
