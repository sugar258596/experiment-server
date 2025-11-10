import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorites } from './entities/favorites.entity';
import { User } from '../user/entities/user.entity';
import { Lab } from '../lab/entities/lab.entity';
import { SearchAppointmentDto } from '../appointment/dto/search-appointment.dto';

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

  async getMyFavorites(userId: number, searchDto: SearchAppointmentDto) {
    const { keyword, department, labId, page = 1, pageSize = 10 } = searchDto;

    // 构建查询构建器
    const queryBuilder = this.favoritesRepository
      .createQueryBuilder('favorites')
      .leftJoinAndSelect('favorites.lab', 'lab')
      .where('favorites.userId = :userId', { userId });

    // 关键词搜索：搜索实验室名称或描述
    if (keyword) {
      queryBuilder.andWhere(
        '(lab.name LIKE :keyword OR lab.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 院系筛选
    if (department) {
      queryBuilder.andWhere('lab.department = :department', { department });
    }

    // 实验室ID筛选
    if (labId) {
      queryBuilder.andWhere('lab.id = :labId', { labId: Number(labId) });
    }

    // 按收藏时间倒序排列
    queryBuilder.orderBy('favorites.createdAt', 'DESC');

    // 分页查询
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 执行查询
    const [data, total] = await queryBuilder.getManyAndCount();

    // 返回分页结果
    return {
      data,
      total,
    };
  }

  async toggle(userId: number, labId: number) {
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
      await this.favoritesRepository.remove(existingFavorite);
      return { isFavorited: false, message: '已取消收藏' };
    } else {
      const favorite = this.favoritesRepository.create({
        user: { id: userId },
        lab: { id: labId },
        userId,
        labId,
      });
      await this.favoritesRepository.save(favorite);
      return { message: '收藏成功' };
    }
  }
}
