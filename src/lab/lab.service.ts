import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lab } from './entities/lab.entity';
import { LabStatus } from '../common/enums/status.enum';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { SearchLabDto } from './dto/search-lab.dto';
import { PaginationDto } from 'src/common/Dto';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(createLabDto: CreateLabDto): Promise<Lab> {
    const lab = this.labRepository.create(createLabDto);
    return await this.labRepository.save(lab);
  }

  async findAll(searchDto: SearchLabDto) {
    const {
      keyword,
      department,
      minCapacity,
      maxCapacity,
      status,
      equipmentType,
      page = 1,
      pagSize = 10,
    } = searchDto;
    const skip = (page - 1) * pagSize;

    const queryBuilder = this.labRepository.createQueryBuilder('lab');

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

    if (status) {
      queryBuilder.andWhere('lab.status = :status', { status });
    }

    if (equipmentType) {
      queryBuilder.andWhere(':equipmentType = ANY(lab.equipmentList)', {
        equipmentType,
      });
    }

    queryBuilder.skip(skip).take(pagSize).orderBy('lab.createdAt', 'DESC');

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

  async remove(id: number): Promise<void> {
    const lab = await this.findOne(id);
    await this.labRepository.remove(lab);
  }

  async getPopularLabs(searchDto: PaginationDto) {
    const { page = 1, pagSize = 10 } = searchDto;
    const skip = (page - 1) * pagSize;
    return await this.labRepository.find({
      skip,
      take: pagSize,
      order: { rating: 'DESC' },
      where: { status: LabStatus.ACTIVE },
    });
  }
  async getOptions(searchDto: PaginationDto) {
    const { page = 1, pagSize = 10, keyword } = searchDto;
    const skip = (page - 1) * pagSize;

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

    queryBuilder.skip(skip).take(pagSize).orderBy('lab.name', 'ASC');

    const [labs, total] = await queryBuilder.getManyAndCount();

    return {
      data: labs,
      total,
    };
  }
}
