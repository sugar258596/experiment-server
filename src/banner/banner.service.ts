import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { BannerType } from './entities/banner-type.entity';
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
      order: { createdAt: 'DESC' },
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
      status: createBannerDto.status,
    });

    // 保存轮播图
    const savedBanner = await this.bannerRepository.save(banner);

    // 处理图片上传
    if (files && files.length > 0) {
      const imageUrls: string[] = [];
      files.forEach((file) => {
        const imageUrl = generateFileUrl('banners', file.filename);
        imageUrls.push(imageUrl);
      });

      savedBanner.images = imageUrls;
      await this.bannerRepository.save(savedBanner);
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
      .addOrderBy('banner.createdAt', 'DESC');

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
      relations: ['type'],
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
   * 2. 上传文件 + 传入images(URL字符串/数组) - 混合模式：保留images中指定的旧图片，并追加新上传的图片
   * 3. 仅传入images(URL字符串/数组) - 保持/调整模式：只保留images中指定的图片
   * 4. 都不传 - 保持原样：保持数据库中原有的图片
   */
  async updateBanner(
    id: number,
    updateBannerDto: UpdateBannerDto,
    files: Array<Express.Multer.File>,
  ) {
    const banner = await this.bannerRepository.findOne({
      where: { id },
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

    if (updateBannerDto.status !== undefined) {
      banner.status = updateBannerDto.status;
    }

    const oldImages = banner.images || [];

    // 处理图片更新逻辑
    let finalImages: string[] = [];
    let imagesToDelete: string[] = [];

    // 辅助函数：将images字段转换为字符串数组
    const parseImagesToArray = (
      images: string | string[] | undefined,
    ): string[] | null => {
      if (!images) return null;

      // 如果已经是数组，直接返回
      if (Array.isArray(images)) {
        return images;
      }

      // 如果是字符串，转换为数组
      if (typeof images === 'string') {
        return [images];
      }

      return null;
    };

    // 情况1：上传了新文件
    if (files && files.length > 0) {
      // 生成新图片URL
      const newImageUrls: string[] = [];
      files.forEach((file) => {
        const imageUrl = generateFileUrl('banners', file.filename);
        newImageUrls.push(imageUrl);
      });

      // 检查是否同时传入了images字段（字符串或字符串数组）
      // 排除 File[] 类型（如果是数组，检查第一个元素是否为字符串）
      const imagesValue =
        typeof updateBannerDto.images === 'string' ||
        (Array.isArray(updateBannerDto.images) &&
          updateBannerDto.images.length > 0 &&
          typeof updateBannerDto.images[0] === 'string')
          ? (updateBannerDto.images as string | string[])
          : undefined;
      const oldImagesToKeep = parseImagesToArray(imagesValue);

      if (oldImagesToKeep && oldImagesToKeep.length > 0) {
        // 混合模式：保留images中指定的旧图片 + 追加新上传的图片
        finalImages = [...oldImagesToKeep, ...newImageUrls];
        // 计算需要删除的旧图片（数据库中有的，但用户没有指定保留的）
        imagesToDelete = oldImages.filter(
          (img) => !oldImagesToKeep.includes(img),
        );
      } else {
        // 替换模式：删除所有旧图片，只使用新图片
        finalImages = newImageUrls;
        imagesToDelete = oldImages;
      }
    } else if (updateBannerDto.images) {
      // 情况2：仅传入images字段（字符串或字符串数组），没有上传新文件
      // 排除 File[] 类型（如果是数组，检查第一个元素是否为字符串）
      const imagesValue =
        typeof updateBannerDto.images === 'string' ||
        (Array.isArray(updateBannerDto.images) &&
          updateBannerDto.images.length > 0 &&
          typeof updateBannerDto.images[0] === 'string')
          ? (updateBannerDto.images as string | string[])
          : undefined;
      const imagesToKeep = parseImagesToArray(imagesValue);

      if (imagesToKeep && imagesToKeep.length > 0) {
        // 保持/调整模式：使用传入的图片
        finalImages = imagesToKeep;
        // 计算需要删除的图片（数据库中有的，但用户没有保留的）
        imagesToDelete = oldImages.filter((img) => !imagesToKeep.includes(img));
      } else {
        // 无效数据，保持原有图片
        finalImages = oldImages;
      }
    } else {
      // 情况3：既没有上传文件，也没有传入images字段
      // 保持原有图片
      finalImages = oldImages;
    }

    // 删除不需要的旧图片文件
    if (imagesToDelete.length > 0) {
      for (const imageUrl of imagesToDelete) {
        deleteFile(imageUrl);
      }
    }

    banner.images = finalImages;
    await this.bannerRepository.save(banner);

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
    });

    if (!banner) {
      throw new NotFoundException(`轮播图ID ${id} 不存在`);
    }

    // 删除关联的图片文件
    if (banner.images && banner.images.length > 0) {
      for (const imageUrl of banner.images) {
        deleteFile(imageUrl);
      }
    }

    await this.bannerRepository.softRemove(banner);

    return {
      message: '轮播图删除成功',
    };
  }
}
