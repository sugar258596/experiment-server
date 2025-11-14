import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { BannerType } from './entities/banner-type.entity';
import { BannerImage } from './entities/banner-image.entity';
import { CreateBannerTypeDto } from './dto/create-banner-type.dto';
import { UpdateBannerTypeDto } from './dto/update-banner-type.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { generateFileUrl, deleteFile } from '../config/upload.config';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
    @InjectRepository(BannerType)
    private bannerTypeRepository: Repository<BannerType>,
    @InjectRepository(BannerImage)
    private bannerImageRepository: Repository<BannerImage>,
  ) {}

  // ==================== 轮播图类型相关方法 ====================

  /**
   * 创建轮播图类型
   */
  async createType(createBannerTypeDto: CreateBannerTypeDto) {
    const bannerType = this.bannerTypeRepository.create(createBannerTypeDto);
    await this.bannerTypeRepository.save(bannerType);
    return {
      message: '轮播图类型创建成功',
    };
  }

  /**
   * 获取所有轮播图类型
   */
  async findAllTypes() {
    const types = await this.bannerTypeRepository.find({
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
    return {
      data: types,
      total: types.length,
    };
  }

  /**
   * 获取单个轮播图类型
   */
  async findOneType(id: number) {
    const bannerType = await this.bannerTypeRepository.findOne({
      where: { id },
      relations: ['banners'],
    });

    if (!bannerType) {
      throw new NotFoundException(`轮播图类型ID ${id} 不存在`);
    }

    return bannerType;
  }

  /**
   * 更新轮播图类型
   */
  async updateType(id: number, updateBannerTypeDto: UpdateBannerTypeDto) {
    const bannerType = await this.bannerTypeRepository.findOne({
      where: { id },
    });

    if (!bannerType) {
      throw new NotFoundException(`轮播图类型ID ${id} 不存在`);
    }

    Object.assign(bannerType, updateBannerTypeDto);
    await this.bannerTypeRepository.save(bannerType);

    return {
      message: '轮播图类型更新成功',
    };
  }

  /**
   * 删除轮播图类型（软删除）
   */
  async removeType(id: number) {
    const bannerType = await this.bannerTypeRepository.findOne({
      where: { id },
    });

    if (!bannerType) {
      throw new NotFoundException(`轮播图类型ID ${id} 不存在`);
    }

    await this.bannerTypeRepository.softRemove(bannerType);

    return {
      message: '轮播图类型删除成功',
    };
  }

  // ==================== 轮播图相关方法 ====================

  /**
   * 创建轮播图(支持文件上传)
   */
  async createBanner(
    createBannerDto: CreateBannerDto,
    files: Array<Express.Multer.File>,
  ) {
    // 验证类型ID是否存在
    const bannerType = await this.bannerTypeRepository.findOne({
      where: { id: createBannerDto.typeId },
    });

    if (!bannerType) {
      throw new NotFoundException(
        `轮播图类型ID ${createBannerDto.typeId} 不存在`,
      );
    }

    // 创建轮播图基本信息
    const banner = this.bannerRepository.create({
      title: createBannerDto.title,
      typeId: createBannerDto.typeId,
      link: createBannerDto.link,
      description: createBannerDto.description,
      sort: createBannerDto.sort || 0,
      status: createBannerDto.status,
    });

    // 保存轮播图
    const savedBanner = await this.bannerRepository.save(banner);

    // 处理图片上传
    if (files && files.length > 0) {
      const bannerImages: BannerImage[] = [];
      files.forEach((file, index) => {
        const imageUrl = generateFileUrl('banners', file.filename);
        const bannerImage = this.bannerImageRepository.create({
          bannerId: savedBanner.id,
          imageUrl,
          sort: index,
        });
        bannerImages.push(bannerImage);
      });

      // 批量保存图片
      await this.bannerImageRepository.save(bannerImages);
    }

    return {
      message: '轮播图创建成功',
    };
  }

  /**
   * 获取所有轮播图（可按类型筛选）
   */
  async findAllBanners(typeId?: number) {
    const queryBuilder = this.bannerRepository
      .createQueryBuilder('banner')
      .leftJoinAndSelect('banner.type', 'type')
      .leftJoinAndSelect('banner.images', 'images')
      .orderBy('banner.sort', 'ASC')
      .addOrderBy('banner.createdAt', 'DESC')
      .addOrderBy('images.sort', 'ASC');

    if (typeId) {
      queryBuilder.andWhere('banner.typeId = :typeId', { typeId });
    }

    const banners = await queryBuilder.getMany();

    return {
      data: banners,
      total: banners.length,
    };
  }

  /**
   * 获取单个轮播图
   */
  async findOneBanner(id: number) {
    const banner = await this.bannerRepository.findOne({
      where: { id },
      relations: ['type', 'images'],
      order: {
        images: {
          sort: 'ASC',
        },
      },
    });

    if (!banner) {
      throw new NotFoundException(`轮播图ID ${id} 不存在`);
    }

    return banner;
  }

  /**
   * 更新轮播图(支持文件上传 - 自动检测模式)
   * @param id 轮播图ID
   * @param updateBannerDto 更新数据
   * @param files 上传的新图片文件（由multer拦截器处理）
   *
   * 自动检测模式说明：
   * 1. 仅上传文件 - 替换模式：删除所有旧图片，只使用新上传的图片
   * 2. 上传文件 + 传入imageIds(数字数组) - 混合模式：保留imageIds中指定的旧图片，并追加新上传的图片
   * 3. 仅传入imageIds(数字数组) - 保持/调整模式：只保留imageIds中指定的图片
   * 4. 都不传 - 保持原样：保持数据库中原有的图片
   */
  async updateBanner(
    id: number,
    updateBannerDto: UpdateBannerDto,
    files: Array<Express.Multer.File>,
  ) {
    const banner = await this.bannerRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!banner) {
      throw new NotFoundException(`轮播图ID ${id} 不存在`);
    }

    // 如果更新了类型ID，验证新类型是否存在
    if (updateBannerDto.typeId && updateBannerDto.typeId !== banner.typeId) {
      const bannerType = await this.bannerTypeRepository.findOne({
        where: { id: updateBannerDto.typeId },
      });

      if (!bannerType) {
        throw new NotFoundException(
          `轮播图类型ID ${updateBannerDto.typeId} 不存在`,
        );
      }
    }

    // 更新轮播图基本信息
    if (updateBannerDto.title !== undefined) {
      banner.title = updateBannerDto.title;
    }
    if (updateBannerDto.typeId !== undefined) {
      banner.typeId = updateBannerDto.typeId;
    }
    if (updateBannerDto.link !== undefined) {
      banner.link = updateBannerDto.link;
    }
    if (updateBannerDto.description !== undefined) {
      banner.description = updateBannerDto.description;
    }
    if (updateBannerDto.sort !== undefined) {
      banner.sort = updateBannerDto.sort;
    }
    if (updateBannerDto.status !== undefined) {
      banner.status = updateBannerDto.status;
    }

    await this.bannerRepository.save(banner);

    // 处理图片更新逻辑
    const oldImages = banner.images || [];
    const hasNewFiles = files && files.length > 0;
    const hasImageIds =
      updateBannerDto.imageIds && updateBannerDto.imageIds.length > 0;

    if (hasNewFiles || hasImageIds) {
      let imagesToKeep: BannerImage[] = [];
      let imagesToDelete: BannerImage[] = [];

      if (hasImageIds) {
        // 保留指定ID的图片
        imagesToKeep = oldImages.filter((img) =>
          updateBannerDto.imageIds?.includes(img.id),
        );
        imagesToDelete = oldImages.filter(
          (img) => !updateBannerDto.imageIds?.includes(img.id),
        );
      } else if (hasNewFiles) {
        // 只有新文件，删除所有旧图片
        imagesToDelete = oldImages;
      }

      // 删除不需要的旧图片
      if (imagesToDelete.length > 0) {
        for (const image of imagesToDelete) {
          deleteFile(image.imageUrl);
          await this.bannerImageRepository.softRemove(image);
        }
      }

      // 添加新图片
      if (hasNewFiles) {
        const newImages: BannerImage[] = [];
        const startSort = imagesToKeep.length;

        files.forEach((file, index) => {
          const imageUrl = generateFileUrl('banners', file.filename);
          const bannerImage = this.bannerImageRepository.create({
            bannerId: banner.id,
            imageUrl,
            sort: startSort + index,
          });
          newImages.push(bannerImage);
        });

        await this.bannerImageRepository.save(newImages);
      }
    }

    return {
      message: '轮播图更新成功',
    };
  }

  /**
   * 删除轮播图（软删除）
   */
  async removeBanner(id: number) {
    const banner = await this.bannerRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!banner) {
      throw new NotFoundException(`轮播图ID ${id} 不存在`);
    }

    // 删除关联的图片文件
    if (banner.images && banner.images.length > 0) {
      for (const image of banner.images) {
        deleteFile(image.imageUrl);
        await this.bannerImageRepository.softRemove(image);
      }
    }

    await this.bannerRepository.softRemove(banner);

    return {
      message: '轮播图删除成功',
    };
  }
}
