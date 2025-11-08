import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lab } from './entities/lab.entity';
import { LabStatus } from '../common/enums/status.enum';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { SearchLabDto } from './dto/search-lab.dto';
import { CreateLabFormDto } from './dto/create-lab-form.dto';
import { UpdateLabFormDto } from './dto/update-lab-form.dto';
import { PaginationDto } from 'src/common/Dto';
import { generateFileUrl, deleteFile } from 'src/config/upload.config';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(createLabDto: CreateLabDto) {
    const lab = this.labRepository.create(createLabDto);
    await this.labRepository.save(lab);
    return {
      message: '创建成功',
    };
  }

  /**
   * 创建实验室(支持文件上传)
   */
  async createWithFiles(
    createLabFormDto: CreateLabFormDto,
    files: Array<Express.Multer.File>,
  ) {
    // 生成图片URL数组
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      files.forEach((file) => {
        const imageUrl = generateFileUrl('labs', file.filename);
        imageUrls.push(imageUrl);
      });
    }

    // 创建实验室数据
    const labData: CreateLabDto = {
      ...createLabFormDto,
      images: imageUrls,
    };

    const lab = this.labRepository.create(labData);
    await this.labRepository.save(lab);

    return {
      message: '创建成功',
    };
  }

  async findAll(searchDto: SearchLabDto) {
    const {
      keyword,
      department,
      minCapacity,
      maxCapacity,
      equipmentType,
      page = 1,
      status,
      pageSize = 10,
    } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.labRepository.createQueryBuilder('lab');
    if (status) {
      queryBuilder.andWhere('lab.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(lab.name LIKE :keyword OR lab.description LIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    if (department) {
      queryBuilder.andWhere('lab.department = :department', { department });
    }

    if (minCapacity !== undefined) {
      queryBuilder.andWhere('lab.capacity >= :minCapacity', { minCapacity });
    }

    if (maxCapacity !== undefined) {
      queryBuilder.andWhere('lab.capacity <= :maxCapacity', { maxCapacity });
    }

    if (equipmentType) {
      queryBuilder.andWhere(
        'JSON_CONTAINS(lab.equipmentList, JSON_QUOTE(:equipmentType))',
        {
          equipmentType,
        },
      );
    }

    queryBuilder.skip(skip).take(pageSize).orderBy('lab.createdAt', 'DESC');

    const [labs, total] = await queryBuilder.getManyAndCount();

    return {
      data: labs,
      total,
    };
  }

  async findOne(id: number): Promise<Lab> {
    const lab = await this.labRepository.findOne({
      where: { id },
      relations: ['appointments', 'favorites', 'evaluations'],
    });

    if (!lab) {
      throw new NotFoundException(`实验室ID ${id} 不存在`);
    }

    return lab;
  }

  async update(id: number, updateLabDto: UpdateLabDto): Promise<Lab> {
    const lab = await this.findOne(id);
    Object.assign(lab, updateLabDto);
    return await this.labRepository.save(lab);
  }

  /**
   * 更新实验室(支持文件上传)
   * @param id 实验室ID
   * @param updateLabFormDto 更新表单数据
   * @param files 上传的新图片文件（由multer拦截器处理）
   */
  async updateWithFiles(
    id: number,
    updateLabFormDto: UpdateLabFormDto,
    files: Array<Express.Multer.File>,
  ) {
    // 查询现有实验室
    const lab = await this.findOne(id);
    const oldImages = lab.images || [];

    // 处理图片更新逻辑
    let finalImages: string[] = [];
    let shouldDeleteOldImages = false;

    // 判断images字段的类型
    if (files && files.length > 0) {
      // 情况1：上传了新文件（files是文件数组）
      // 生成新图片URL
      const newImageUrls: string[] = [];
      files.forEach((file) => {
        const imageUrl = generateFileUrl('labs', file.filename);
        newImageUrls.push(imageUrl);
      });

      finalImages = newImageUrls;
      shouldDeleteOldImages = true; // 需要删除所有旧图片
    } else if (
      updateLabFormDto.images &&
      typeof updateLabFormDto.images === 'string'
    ) {
      // 情况2：传入的是字符串（JSON格式的URL数组）
      try {
        const parsed: unknown = JSON.parse(updateLabFormDto.images);
        if (Array.isArray(parsed)) {
          finalImages = parsed as string[];
          // 不删除旧图片，保持原有的
          shouldDeleteOldImages = false;
        } else {
          // 格式不正确，保持原有图片
          finalImages = oldImages;
        }
      } catch {
        // JSON解析失败，保持原有图片
        finalImages = oldImages;
      }
    } else {
      // 情况3：未提供images字段，保持原有图片
      finalImages = oldImages;
    }

    // 删除旧图片文件（仅在重新上传时）
    if (shouldDeleteOldImages && oldImages.length > 0) {
      oldImages.forEach((imageUrl) => {
        deleteFile(imageUrl);
      });
    }

    // 构建更新数据
    const updateData: UpdateLabDto = {
      ...updateLabFormDto,
      images: finalImages,
    };

    // 更新实验室
    Object.assign(lab, updateData);
    const savedLab = await this.labRepository.save(lab);

    return {
      message: '更新成功',
      data: {
        id: savedLab.id,
        name: savedLab.name,
        images: savedLab.images,
      },
    };
  }

  async remove(id: number): Promise<void> {
    const lab = await this.findOne(id);
    await this.labRepository.remove(lab);
  }

  async getPopularLabs(searchDto: PaginationDto) {
    const { page = 1, pageSize = 10 } = searchDto;
    const skip = (page - 1) * pageSize;
    return await this.labRepository.find({
      skip,
      take: pageSize,
      order: { rating: 'DESC' },
      where: { status: LabStatus.ACTIVE },
    });
  }
  async getOptions(searchDto: PaginationDto) {
    const { page = 1, pageSize = 10, keyword } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.labRepository
      .createQueryBuilder('lab')
      .select(['lab.id', 'lab.name']);

    // 只查询正常状态的实验室
    queryBuilder.andWhere('lab.status = :status', {
      status: LabStatus.ACTIVE,
    });

    // 支持通过关键字搜索实验室名称、位置、所属院系
    if (keyword) {
      queryBuilder.andWhere(
        '(lab.name LIKE :keyword OR lab.location LIKE :keyword OR lab.department LIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    queryBuilder.skip(skip).take(pageSize).orderBy('lab.name', 'ASC');

    const [labs, total] = await queryBuilder.getManyAndCount();

    return {
      data: labs,
      total,
    };
  }
}
