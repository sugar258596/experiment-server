import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorites } from './entities/favorites.entity';
import { User } from '../user/entities/user.entity';
import { Lab } from '../lab/entities/lab.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorites)
    private favoritesRepository: Repository<Favorites>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async add(userId: string, labId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const lab = await this.labRepository.findOne({ where: { id: labId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (!lab) {
      throw new NotFoundException('实验室不存在');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, lab: { id: labId } },
    });

    if (existingFavorite) {
      throw new ConflictException('已经收藏过该实验室');
    }

    const favorite = this.favoritesRepository.create({
      user,
      lab,
    });

    return await this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, labId: string) {
    const favorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, lab: { id: labId } },
    });

    if (!favorite) {
      throw new NotFoundException('未收藏该实验室');
    }

    await this.favoritesRepository.remove(favorite);
    return { message: '已取消收藏' };
  }

  async getMyFavorites(userId: string) {
    return await this.favoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['lab'],
      order: { createdAt: 'DESC' },
    });
  }

  async isFavorited(userId: string, labId: string) {
    const favorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, lab: { id: labId } },
    });

    return { isFavorited: !!favorite };
  }
}
