import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsStatus } from '../common/enums/status.enum';
import { CreateNewsDto } from './dto/create-news.dto';
import { SearchNewsDto } from './dto/search-news.dto';
import { UserPayload } from '../common/interfaces/request.interface';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async create(createDto: CreateNewsDto, user: UserPayload) {
    const news = this.newsRepository.create({
      ...createDto,
      authorId: user.id,
    });
    return await this.newsRepository.save(news);
  }

  async findAll(searchDto: SearchNewsDto) {
    const { keyword, tag, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.author', 'author')
      .where('news.status = :status', { status: NewsStatus.APPROVED });

    if (keyword) {
      queryBuilder.andWhere(
        '(news.title LIKE :keyword OR news.content LIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(news.tags)', { tag });
    }

    queryBuilder.skip(skip).take(limit).orderBy('news.createdAt', 'DESC');

    const [news, total] = await queryBuilder.getManyAndCount();

    return {
      data: news,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!news) {
      throw new NotFoundException(`动态ID ${id} 不存在`);
    }

    return news;
  }

  async like(id: number) {
    const news = await this.findOne(id);
    news.likes += 1;
    return await this.newsRepository.save(news);
  }

  async getPendingNews() {
    return await this.newsRepository.find({
      where: { status: NewsStatus.PENDING },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async review(id: number, approved: boolean) {
    const news = await this.findOne(id);
    news.status = approved ? NewsStatus.APPROVED : NewsStatus.REJECTED;
    return await this.newsRepository.save(news);
  }
}
