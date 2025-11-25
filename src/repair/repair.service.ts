import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { Repair } from './entities/repair.entity';
import { Instrument } from '../instrument/entities/instrument.entity';
import { RepairStatus } from '../common/enums/status.enum';
import { ReportRepairDto } from './dto/report-repair.dto';
import { QueryRepairDto } from './dto/query-repair.dto';
import { QueryMyRepairDto } from './dto/query-my-repair.dto';
import { UserPayload } from '../common/interfaces/request.interface';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { generateFileUrl } from 'src/config/upload.config';

@Injectable()
export class RepairService {
  constructor(
    @InjectRepository(Repair)
    private repairRepository: Repository<Repair>,
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    private notificationService: NotificationService,
  ) {}

  /**
   * 报告仪器故障
   */
  async report(
    instrumentId: number,
    user: UserPayload,
    reportDto: ReportRepairDto,
    files?: Array<Express.Multer.File>,
  ) {
    const instrument = await this.instrumentRepository.findOne({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw new NotFoundException(`仪器ID ${instrumentId} 不存在`);
    }

    // 生成上传图片的URL数组
    const uploadedImageUrls: string[] = [];
    if (files && files.length > 0) {
      files.forEach((file) => {
        const imageUrl = generateFileUrl('repairs', file.filename);
        uploadedImageUrls.push(imageUrl);
      });
    }

    const repair = this.repairRepository.create({
      instrument,
      reporterId: user.id,
      faultType: reportDto.faultType,
      description: reportDto.description,
      images: uploadedImageUrls,
      urgency: reportDto.urgency,
      repairNumber: `R${Date.now()}${Math.floor(Math.random() * 1000)}`,
    });

    await this.repairRepository.save(repair);
    return {
      message: '报修成功',
    };
  }

  /**
   * 获取维修记录（支持关键词搜索、状态筛选和分页）
   */
  async getRepairs(queryDto: QueryRepairDto) {
    const { keyword, status, page = 1, pageSize = 10 } = queryDto;

    const queryBuilder = this.repairRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect('repair.instrument', 'instrument')
      .leftJoinAndSelect('repair.reporter', 'reporter')
      .leftJoinAndSelect('repair.assignee', 'assignee');

    // 关键词搜索（仪器名称）
    if (keyword) {
      queryBuilder.andWhere('instrument.name LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // 状态筛选
    if (status !== undefined && status !== null) {
      queryBuilder.andWhere('repair.status = :status', { status });
    }

    // 按创建时间倒序排列
    queryBuilder.orderBy('repair.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 获取数据和总数
    const [repairs, total] = await queryBuilder.getManyAndCount();

    // 使用 instanceToPlain 序列化数据，自动排除 @Exclude() 标记的字段（如密码）
    const data = instanceToPlain(repairs);

    return {
      data,
      total,
    };
  }

  /**
   * 更新维修状态
   */
  async updateRepairStatus(
    repairId: number,
    status: RepairStatus,
    summary?: string,
  ) {
    const repair = await this.repairRepository.findOne({
      where: { id: repairId },
      relations: ['instrument', 'reporter'],
    });

    if (!repair) {
      throw new NotFoundException('报修记录不存在');
    }

    // 保存维修状态更新
    repair.status = status;
    if (summary) {
      repair.repairSummary = summary;
    }
    if (status === RepairStatus.COMPLETED) {
      repair.completedAt = new Date();
    }

    const savedRepair = await this.repairRepository.save(repair);

    // 发送通知给报告人
    let notificationTitle = '';
    let notificationContent = '';

    switch (status) {
      case RepairStatus.IN_PROGRESS:
        notificationTitle = '维修进度更新';
        notificationContent = `您的仪器维修已开始处理。\n仪器：${savedRepair.instrument.name}\n维修单号：${savedRepair.repairNumber}`;
        break;
      case RepairStatus.COMPLETED:
        notificationTitle = '维修完成';
        notificationContent = `您的仪器维修已完成。\n仪器：${savedRepair.instrument.name}\n维修单号：${savedRepair.repairNumber}\n维修总结：${summary || '无'}`;
        break;
      default:
        notificationTitle = '维修状态更新';
        notificationContent = `您的仪器维修状态已更新为：${status}。\n仪器：${savedRepair.instrument.name}`;
    }

    await this.notificationService.create({
      userId: savedRepair.reporterId,
      type: NotificationType.REPAIR_PROGRESS,
      title: notificationTitle,
      content: notificationContent,
      relatedId: `repair-${savedRepair.id}`,
    });

    return {
      message: '维修状态更新成功',
    };
  }

  /**
   * 获取我的维修记录（支持关键词搜索、状态筛选和分页）
   */
  async getMyRepairs(userId: number, queryDto: QueryMyRepairDto) {
    const { keyword, status, page = 1, pageSize = 10 } = queryDto;

    const queryBuilder = this.repairRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect('repair.instrument', 'instrument')
      .leftJoinAndSelect('repair.assignee', 'assignee')
      .where('repair.reporterId = :userId', { userId });

    // 关键词搜索（仪器名称）
    if (keyword) {
      queryBuilder.andWhere('instrument.name LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // 状态筛选
    if (status !== undefined && status !== null) {
      queryBuilder.andWhere('repair.status = :status', { status });
    }

    // 按创建时间倒序排列
    queryBuilder.orderBy('repair.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 获取数据和总数
    const [repairs, total] = await queryBuilder.getManyAndCount();

    // 使用 instanceToPlain 序列化数据，自动排除 @Exclude() 标记的字段（如密码）
    const data = instanceToPlain(repairs);

    return {
      data,
      total,
    };
  }
}
