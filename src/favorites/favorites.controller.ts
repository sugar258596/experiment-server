import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':labId')
  add(@Param('labId') labId: string, @Req() req: any) {
    return this.favoritesService.add(req.user.id, labId);
  }

  @Delete(':labId')
  remove(@Param('labId') labId: string, @Req() req: any) {
    return this.favoritesService.remove(req.user.id, labId);
  }

  @Get()
  getMyFavorites(@Req() req: any) {
    return this.favoritesService.getMyFavorites(req.user.id);
  }

  @Get(':labId/check')
  isFavorited(@Param('labId') labId: string, @Req() req: any) {
    return this.favoritesService.isFavorited(req.user.id, labId);
  }
}
