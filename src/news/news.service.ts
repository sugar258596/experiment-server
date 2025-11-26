import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { News } from './entities/news.entity';
import { NewsStatus } from '../common/enums/status.enum';
import { CreateNewsDto } from './dto/create-news.dto';
import { SearchNewsDto } from './dto/search-news.dto';
import { CreateNewsFormDto } from './dto/create-news-form.dto';
import { UserPayload } from '../common/interfaces/request.interface';
import { Role } from '../common/enums/role.enum';
import { generateFileUrl } from 'src/config/upload.config';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async create(createDto: CreateNewsDto, user: UserPayload) {
    if (!user || !user.id) {
      throw new Error('用户信息不完整,无法创建新闻');
    }

    const news = this.newsRepository.create({
      title: createDto.title,
      content: createDto.content,
      authorId: user.id,
      status: NewsStatus.APPROVED, // 设为已发布状态便于测试
    });
    return await this.newsRepository.save(news);
  }

  /**
   * 创建新闻(支持文件上传)
   */
  async createWithFiles(
    createFormDto: CreateNewsFormDto,
    files: {
      coverImage?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    user: UserPayload,
  ) {
    if (!user || !user.id) {
      throw new Error('用户信息不完整,无法创建新闻');
    }

    // 处理封面图片
    let coverImageUrl: string | undefined;
    if (files.coverImage && files.coverImage.length > 0) {
      coverImageUrl = generateFileUrl('news', files.coverImage[0].filename);
    }

    // 处理新闻图片
    const imageUrls: string[] = [];
    if (files.images && files.images.length > 0) {
      files.images.forEach((file) => {
        const imageUrl = generateFileUrl('news', file.filename);
        imageUrls.push(imageUrl);
      });
    }

    // 创建新闻数据
    const newsData: CreateNewsDto = {
      ...createFormDto,
      coverImage: coverImageUrl,
      images: imageUrls,
    };

    const news = this.newsRepository.create({
      ...newsData,
      authorId: user.id,
      status: NewsStatus.APPROVED, // 设为已发布状态便于测试
    });

    await this.newsRepository.save(news);

    return {
      message: '创建成功',
    };
  }

  async findAll(searchDto: SearchNewsDto) {
    const { keyword, tag, page = 1, pageSize = 10 } = searchDto;
    const skip = (page - 1) * pageSize;

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

    queryBuilder.skip(skip).take(pageSize).orderBy('news.createdAt', 'DESC');

    const [news, total] = await queryBuilder.getManyAndCount();

    // 使用 instanceToPlain 序列化数据，自动排除 @Exclude() 标记的字段（如密码）
    const serializedNews = instanceToPlain(news);

    return {
      data: serializedNews,
      total,
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

    // 使用 instanceToPlain 序列化数据，自动排除 @Exclude() 标记的字段（如密码）
    return instanceToPlain(news);
  }

  async like(id: number) {
    const news = await this.findOne(id);
    news.likes += 1;
    return await this.newsRepository.save(news);
  }

  async getPendingNews() {
    const pendingNews = await this.newsRepository.find({
      where: { status: NewsStatus.PENDING },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    // 使用 instanceToPlain 序列化数据，自动排除 @Exclude() 标记的字段（如密码）
    return instanceToPlain(pendingNews);
  }

  async review(id: number, approved: boolean, currentUser?: UserPayload) {
    // 如果提供了 currentUser,则进行权限检查
    if (currentUser && !this.isAdminOrSuperAdmin(currentUser.role)) {
      throw new ForbiddenException('需要管理员权限才能审核新闻');
    }

    const news = await this.findOne(id);
    news.status = approved ? NewsStatus.APPROVED : NewsStatus.REJECTED;

    if (currentUser) {
      news.reviewerId = currentUser.id;
      news.reviewTime = new Date();
    }

    return await this.newsRepository.save(news);
  }

  private isAdminOrSuperAdmin(role: Role): boolean {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }
}
