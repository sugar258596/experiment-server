import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorites } from './entities/favorites.entity';
import { User } from '../user/entities/user.entity';
import { Lab } from '../lab/entities/lab.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorites, User, Lab])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
