import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Lab, LabStatus } from './entities/lab.entity';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { SearchLabDto } from './dto/search-lab.dto';

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
      limit = 10,
    } = searchDto;
    const skip = (page - 1) * limit;

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

    queryBuilder.skip(skip).take(limit).orderBy('lab.createdAt', 'DESC');

    const [labs, total] = await queryBuilder.getManyAndCount();

    return {
      data: labs,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Lab> {
    const lab = await this.labRepository.findOne({
      where: { id },
      relations: ['appointments', 'favorites', 'evaluations'],
    });

    if (!lab) {
      throw new NotFoundException(`实验室ID ${id} 不存在`);
    }

    return lab;
  }

  async update(id: string, updateLabDto: UpdateLabDto): Promise<Lab> {
    const lab = await this.findOne(id);
    Object.assign(lab, updateLabDto);
    return await this.labRepository.save(lab);
  }

  async remove(id: string): Promise<void> {
    const lab = await this.findOne(id);
    await this.labRepository.remove(lab);
  }

  async getPopularLabs(limit: number = 6) {
    return await this.labRepository.find({
      take: limit,
      order: { rating: 'DESC' },
      where: { status: LabStatus.ACTIVE },
    });
  }
}
