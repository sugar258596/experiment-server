import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from 'src/common/guards';
import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { SearchAppointmentDto } from 'src/appointment/dto/search-appointment.dto';

@ApiTags('我的收藏')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('appointments/:labId')
  @ApiOperation({
    summary: '切换收藏状态实验室',
    description: '切换实验室的收藏状态，如果已收藏则取消，如果未收藏则添加',
  })
  @ApiParam({ name: 'labId', description: '实验室ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '操作成功',
    schema: {
      type: 'object',
    },
  })
  toggle(@Param('labId') labId: number, @Req() req: AuthenticatedRequest) {
    return this.favoritesService.toggle(req.user.id, labId);
  }

  @Get('appointments')
  @ApiOperation({
    summary: '获取我的收藏实验室',
    description:
      '查询当前用户收藏的所有实验室，支持分页和筛选（关键词搜索、院系筛选）',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getMyFavorites(
    @Req() req: AuthenticatedRequest,
    @Query() searchDto: SearchAppointmentDto,
  ) {
    return this.favoritesService.getMyFavorites(req.user.id, searchDto);
  }
}
