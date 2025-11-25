import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Lab } from './entities/lab.entity';
import { Instrument } from '../instrument/entities/instrument.entity';
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
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
  ) {}

  /**
   * 为实验室添加设备列表（从关联的仪器中生成）
   */
  private addEquipmentList(lab: Lab) {
    const { instruments: equipmentList, ...newLab } = lab;

    const instruments =
      equipmentList?.map((instrument) => {
        return {
          id: instrument.id,
          name: instrument.name,
        };
      }) || [];
    return { ...newLab, instruments };
  }

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

    // 从formDto中排除images字段，避免干扰
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images, ...restFormDto } = createLabFormDto;

    // 创建实验室数据
    const labData: CreateLabDto = {
      ...restFormDto,
      images: imageUrls,
    };

    const lab = this.labRepository.create(labData);
    const savedLab = await this.labRepository.save(lab);

    // 如果提供了仪器ID数组，则关联仪器
    if (
      createLabFormDto.instrumentIds &&
      createLabFormDto.instrumentIds.length > 0
    ) {
      // 查询所有指定的仪器
      const instruments = await this.instrumentRepository.find({
        where: {
          id: In(createLabFormDto.instrumentIds),
        },
      });

      // 更新这些仪器的 lab 关联
      if (instruments.length > 0) {
        instruments.forEach((instrument) => {
          instrument.lab = savedLab;
        });
        await this.instrumentRepository.save(instruments);
      }
    }

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
      page = 1,
      status,
      pageSize = 10,
    } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.labRepository
      .createQueryBuilder('lab')
      .leftJoinAndSelect('lab.instruments', 'instrument');

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

    queryBuilder.skip(skip).take(pageSize).orderBy('lab.createdAt', 'DESC');

    const [labs, total] = await queryBuilder.getManyAndCount();

    // 为每个实验室添加 equipmentList
    const labsWithEquipment = labs.map((lab) => this.addEquipmentList(lab));

    return {
      data: labsWithEquipment,
      total,
    };
  }

  async findOne(id: number) {
    const lab = await this.labRepository.findOne({
      where: { id },
      relations: ['appointments', 'favorites', 'evaluations', 'instruments'],
    });

    if (!lab) {
      throw new NotFoundException(`实验室ID ${id} 不存在`);
    }

    return this.addEquipmentList(lab);
  }

  async update(id: number, updateLabDto: UpdateLabDto) {
    // 直接查询实体用于更新
    const lab = await this.labRepository.findOne({
      where: { id },
      relations: ['instruments'],
    });

    if (!lab) {
      throw new NotFoundException(`实验室ID ${id} 不存在`);
    }

    Object.assign(lab, updateLabDto);
    await this.labRepository.save(lab);
    return {
      message: '更新成功',
    };
  }

  /**
   * 更新实验室(支持文件上传 - 自动检测模式)
   * @param id 实验室ID
   * @param updateLabFormDto 更新表单数据
   * @param files 上传的新图片文件（由multer拦截器处理）
   *
   * 自动检测模式说明：
   * 1. 仅上传文件 - 替换模式：删除所有旧图片，只使用新上传的图片
   * 2. 上传文件 + 传入images(字符串/字符串数组) - 混合模式：保留images中指定的旧图片，并追加新上传的图片
   * 3. 仅传入images(字符串/字符串数组) - 保持/调整模式：使用images中指定的图片URL
   * 4. 都不传 - 保持原样：保持数据库中原有的图片
   */
  async updateWithFiles(
    id: number,
    updateLabFormDto: UpdateLabFormDto,
    files: Array<Express.Multer.File>,
  ) {
    // 直接查询实体用于更新
    const lab = await this.labRepository.findOne({
      where: { id },
      relations: ['instruments'],
    });

    if (!lab) {
      throw new NotFoundException(`实验室ID ${id} 不存在`);
    }

    const oldImages = lab.images || [];

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
        const imageUrl = generateFileUrl('labs', file.filename);
        newImageUrls.push(imageUrl);
      });

      // 检查是否同时传入了images字段（字符串或字符串数组）
      // 排除 File[] 类型（如果是数组，检查第一个元素是否为字符串）
      const imagesValue =
        typeof updateLabFormDto.images === 'string' ||
        (Array.isArray(updateLabFormDto.images) &&
          updateLabFormDto.images.length > 0 &&
          typeof updateLabFormDto.images[0] === 'string')
          ? (updateLabFormDto.images as string | string[])
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
    } else if (updateLabFormDto.images) {
      // 情况2：仅传入images字段（字符串或字符串数组），没有上传新文件
      // 排除 File[] 类型（如果是数组，检查第一个元素是否为字符串）
      const imagesValue =
        typeof updateLabFormDto.images === 'string' ||
        (Array.isArray(updateLabFormDto.images) &&
          updateLabFormDto.images.length > 0 &&
          typeof updateLabFormDto.images[0] === 'string')
          ? (updateLabFormDto.images as string | string[])
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
      imagesToDelete.forEach((imageUrl) => {
        deleteFile(imageUrl);
      });
    }

    // 从formDto中排除images字段，避免干扰
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images, ...restFormDto } = updateLabFormDto;

    // 构建更新数据
    const updateData: UpdateLabDto = {
      ...restFormDto,
      images: finalImages,
    };

    // 更新实验室
    Object.assign(lab, updateData);
    await this.labRepository.save(lab);

    // 如果提供了 instrumentIds 字段，则更新仪器关联
    if (updateLabFormDto.instrumentIds !== undefined) {
      // 先查询该实验室当前关联的所有仪器
      const currentInstruments = await this.instrumentRepository.find({
        where: {
          lab: { id },
        },
      });

      // 解除当前所有仪器与该实验室的关联
      if (currentInstruments.length > 0) {
        currentInstruments.forEach((instrument) => {
          instrument.lab = null;
        });
        await this.instrumentRepository.save(currentInstruments);
      }

      // 如果提供了新的仪器ID列表，则关联这些仪器
      if (
        updateLabFormDto.instrumentIds &&
        updateLabFormDto.instrumentIds.length > 0
      ) {
        const newInstruments = await this.instrumentRepository.find({
          where: {
            id: In(updateLabFormDto.instrumentIds),
          },
        });

        if (newInstruments.length > 0) {
          newInstruments.forEach((instrument) => {
            instrument.lab = lab;
          });
          await this.instrumentRepository.save(newInstruments);
        }
      }
    }

    return {
      message: '更新成功',
    };
  }

  async remove(id: number): Promise<void> {
    const lab = await this.labRepository.findOne({
      where: { id },
    });

    if (!lab) {
      throw new NotFoundException(`实验室ID ${id} 不存在`);
    }

    // 使用软删除而非真正删除
    await this.labRepository.softRemove(lab);
  }

  async getPopularLabs(searchDto: PaginationDto) {
    const { page = 1, pageSize = 10 } = searchDto;
    const skip = (page - 1) * pageSize;
    const labs = await this.labRepository.find({
      skip,
      take: pageSize,
      order: { rating: 'DESC' },
      where: { status: LabStatus.ACTIVE },
      relations: ['instruments'],
    });

    // 为每个实验室添加 equipmentList
    return labs.map((lab) => this.addEquipmentList(lab));
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
