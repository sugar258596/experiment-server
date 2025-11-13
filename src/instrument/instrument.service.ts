import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { Instrument } from './entities/instrument.entity';
import { InstrumentApplication } from './entities/instrument-application.entity';
import { InstrumentRepair } from './entities/instrument-repair.entity';
import {
  ApplicationStatus,
  RepairStatus,
  InstrumentStatus,
} from '../common/enums/status.enum';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { ApplyInstrumentDto } from './dto/apply-instrument.dto';
import { ReportInstrumentDto } from './dto/report-instrument.dto';
import { UserPayload } from '../common/interfaces/request.interface';
import { Lab } from '../lab/entities/lab.entity';
import { generateFileUrl, deleteFile } from '../config/upload.config';
import { QueryInstrumentDto } from './dto/query-instrument.dto';
import { QueryMyApplicationDto } from './dto/query-my-application.dto';

@Injectable()
export class InstrumentService {
  constructor(
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    @InjectRepository(InstrumentApplication)
    private applicationRepository: Repository<InstrumentApplication>,
    @InjectRepository(InstrumentRepair)
    private repairRepository: Repository<InstrumentRepair>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  /**
   * 创建仪器(支持文件上传)
   */
  async createWithFiles(
    createInstrumentDto: CreateInstrumentDto,
    files: Array<Express.Multer.File>,
  ) {
    const { labId, ...dto } = createInstrumentDto;

    // 生成图片URL数组
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      files.forEach((file) => {
        const imageUrl = generateFileUrl('instruments', file.filename);
        imageUrls.push(imageUrl);
      });
    }

    const instrument = this.instrumentRepository.create({
      ...dto,
      images: imageUrls,
    });

    if (labId) {
      const lab = await this.labRepository.findOne({ where: { id: labId } });
      if (!lab) {
        throw new NotFoundException('所属实验室不存在');
      }
      instrument.lab = lab;
    }

    await this.instrumentRepository.save(instrument);

    return {
      message: '创建成功',
    };
  }

  /**
   * 更新仪器信息(支持文件上传)
   * @param id 仪器ID
   * @param updateInstrumentDto 更新数据
   * @param files 上传的新图片文件（由multer拦截器处理）
   */
  async updateWithFiles(
    id: number,
    updateInstrumentDto: UpdateInstrumentDto,
    files: Array<Express.Multer.File>,
  ) {
    // 查询现有仪器
    const instrument = await this.findOne(id);
    const oldImages = instrument.images || [];

    // 处理图片更新逻辑
    let finalImages: string[] = [];
    let shouldDeleteOldImages = false;

    // 判断images字段的类型
    if (files && files.length > 0) {
      // 情况1：上传了新文件（files是文件数组）
      // 生成新图片URL
      const newImageUrls: string[] = [];
      files.forEach((file) => {
        const imageUrl = generateFileUrl('instruments', file.filename);
        newImageUrls.push(imageUrl);
      });

      finalImages = newImageUrls;
      shouldDeleteOldImages = true; // 需要删除所有旧图片
    } else if (
      updateInstrumentDto.images &&
      typeof updateInstrumentDto.images === 'string'
    ) {
      // 情况2：传入的是字符串（JSON格式的URL数组）
      try {
        const parsed: unknown = JSON.parse(updateInstrumentDto.images);
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

    // 处理实验室关联
    if (updateInstrumentDto.labId) {
      const lab = await this.labRepository.findOne({
        where: { id: updateInstrumentDto.labId },
      });
      if (!lab) {
        throw new NotFoundException('所属实验室不存在');
      }
      instrument.lab = lab;
    }

    // 构建更新数据（排除images字段，因为已经单独处理）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images: _images, ...updateData } = updateInstrumentDto;

    // 更新仪器
    Object.assign(instrument, {
      ...updateData,
      images: finalImages,
    });
    const savedInstrument = await this.instrumentRepository.save(instrument);

    return {
      message: '更新成功',
      data: {
        id: savedInstrument.id,
        name: savedInstrument.name,
        images: savedInstrument.images,
      },
    };
  }

  /**
   * 查询仪器列表（支持关键词、实验室ID、状态筛选和分页）
   */
  async findAll(query: QueryInstrumentDto) {
    const { keyword, labId, status, page = 1, pageSize = 10 } = query;
    const queryBuilder = this.instrumentRepository
      .createQueryBuilder('instrument')
      .leftJoinAndSelect('instrument.lab', 'lab');

    // 关键词搜索（名称或型号）
    if (keyword) {
      queryBuilder.andWhere(
        '(instrument.name LIKE :keyword OR instrument.model LIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    // 实验室ID筛选
    if (labId) {
      queryBuilder.andWhere('instrument.labId = :labId', { labId });
    }

    // 状态筛选
    if (status !== undefined && status !== null) {
      queryBuilder.andWhere('instrument.status = :status', { status });
    }

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 按创建时间倒序排列
    queryBuilder.orderBy('instrument.createdAt', 'DESC');

    // 获取数据和总数
    const [data, total] = await queryBuilder.getManyAndCount();

    const instrument = data.map((item) => {
      const { lab, ...inst } = item;
      return {
        ...inst,
        lab: {
          id: lab?.id,
          name: lab?.name,
          department: lab?.department,
        },
      };
    });

    return {
      data: instrument,
      total,
    };
  }

  async findOne(id: number): Promise<Instrument> {
    const instrument = await this.instrumentRepository.findOne({
      where: { id },
      relations: ['lab'],
    });

    if (!instrument) {
      throw new NotFoundException(`仪器ID ${id} 不存在`);
    }

    return instrument;
  }

  async apply(
    instrumentId: number,
    user: UserPayload,
    applyDto: ApplyInstrumentDto,
  ) {
    // 验证仪器是否存在
    const instrument = await this.findOne(instrumentId);

    // 验证仪器状态
    if (instrument.status !== InstrumentStatus.ACTIVE) {
      const statusLabels = {
        [InstrumentStatus.INACTIVE]: '停用',
        [InstrumentStatus.MAINTENANCE]: '维护中',
        [InstrumentStatus.FAULT]: '故障',
        [InstrumentStatus.BORROWED]: '借出',
      };
      throw new BadRequestException(
        `该仪器当前状态为"${statusLabels[instrument.status]}"，暂时无法申请使用`,
      );
    }

    // 检查该用户是否已对该仪器有未完成的申请（待审核或已通过）
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        applicantId: user.id,
        instrument: { id: instrumentId },
        status: In([ApplicationStatus.PENDING, ApplicationStatus.APPROVED]),
      },
    });

    if (existingApplication) {
      const statusLabels = {
        [ApplicationStatus.PENDING]: '待审核',
        [ApplicationStatus.APPROVED]: '已通过',
      };
      throw new BadRequestException(
        `您已对该仪器提交过申请（状态：${statusLabels[existingApplication.status]}），不能重复申请`,
      );
    }

    if (applyDto.startTime >= applyDto.endTime) {
      throw new BadRequestException('结束时间必须大于开始时间');
    }

    const application = this.applicationRepository.create({
      instrument: { id: instrumentId },
      applicantId: user.id,
      purpose: applyDto.purpose,
      description: applyDto.description,
      startTime: applyDto.startTime,
      endTime: applyDto.endTime,
    });
    await this.applicationRepository.save(application);
    return {
      message: '申请成功',
    };
  }

  async reviewApplication(
    applicationId: number,
    reviewer: UserPayload,
    reviewDto: { status: ApplicationStatus; reason?: string },
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['instrument'],
    });

    if (!application) {
      throw new NotFoundException('申请记录不存在');
    }

    // 验证状态只能是已通过或已拒绝
    if (
      reviewDto.status !== ApplicationStatus.APPROVED &&
      reviewDto.status !== ApplicationStatus.REJECTED
    ) {
      throw new BadRequestException('审核状态只能是已通过(1)或已拒绝(2)');
    }

    application.status = reviewDto.status;
    application.reviewerId = reviewer.id;
    application.reviewTime = new Date();

    // 保存审核意见
    if (reviewDto.reason) {
      application.rejectionReason = reviewDto.reason;
    }
    await this.applicationRepository.save(application);

    // 如果审核通过，将仪器状态设置为借出
    if (reviewDto.status === ApplicationStatus.APPROVED) {
      const instrument = application.instrument;
      instrument.status = InstrumentStatus.BORROWED;
      await this.instrumentRepository.save(instrument);
    }

    return {
      message: '审核成功',
    };
  }

  async report(
    instrumentId: number,
    user: UserPayload,
    reportDto: ReportInstrumentDto,
  ) {
    const instrument = await this.findOne(instrumentId);

    const repair = this.repairRepository.create({
      instrument,
      reporterId: user.id,
      faultType: reportDto.faultType,
      description: reportDto.description,
      urgency: reportDto.urgency,
      repairNumber: `R${Date.now()}${Math.floor(Math.random() * 1000)}`,
    });

    return await this.repairRepository.save(repair);
  }

  async updateRepairStatus(
    repairId: number,
    status: RepairStatus,
    summary?: string,
  ) {
    const repair = await this.repairRepository.findOne({
      where: { id: repairId },
      relations: ['instrument'],
    });

    if (!repair) {
      throw new NotFoundException('报修记录不存在');
    }

    repair.status = status;
    if (summary) {
      repair.repairSummary = summary;
    }
    if (status === RepairStatus.COMPLETED) {
      repair.completedAt = new Date();
    }

    return await this.repairRepository.save(repair);
  }

  async getApplications(queryDto: {
    keyword?: string;
    page?: number;
    pageSize?: number;
    instrumentId?: number;
    applicantId?: number;
    status?: ApplicationStatus;
  }) {
    const {
      keyword,
      page = 1,
      pageSize = 10,
      instrumentId,
      applicantId,
      status,
    } = queryDto;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.instrument', 'instrument')
      .leftJoinAndSelect('instrument.lab', 'lab')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.reviewer', 'reviewer');

    // 关键词搜索（搜索仪器名称、申请目的、申请描述）
    if (keyword) {
      queryBuilder.andWhere(
        '(instrument.name LIKE :keyword OR application.purpose LIKE :keyword OR application.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 按仪器ID筛选
    if (instrumentId) {
      queryBuilder.andWhere('application.instrument.id = :instrumentId', {
        instrumentId,
      });
    }

    // 按申请人ID筛选
    if (applicantId) {
      queryBuilder.andWhere('application.applicantId = :applicantId', {
        applicantId,
      });
    }

    // 按状态筛选
    if (status !== undefined) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    // 按创建时间倒序排列
    queryBuilder.orderBy('application.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 获取数据和总数
    const [applications, total] = await queryBuilder.getManyAndCount();

    // 格式化返回数据
    const formattedData = applications.map((app) => ({
      id: app.id,
      purpose: app.purpose,
      description: app.description,
      startTime: app.startTime,
      endTime: app.endTime,
      status: app.status,
      rejectionReason: app.rejectionReason,
      reviewTime: app.reviewTime,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      // 简化申请人信息
      applicant: app.applicant
        ? {
            id: app.applicant.id,
            username: app.applicant.username,
            role: app.applicant.role,
          }
        : null,
      // 简化审核人信息
      reviewer: app.reviewer
        ? {
            id: app.reviewer.id,
            username: app.reviewer.username,
            role: app.reviewer.role,
          }
        : null,
      // 简化仪器信息并包含实验室
      instrument: app.instrument
        ? {
            id: app.instrument.id,
            name: app.instrument.name,
            serialNumber: app.instrument.serialNumber,
            lab: app.instrument.lab
              ? {
                  id: app.instrument.lab.id,
                  name: app.instrument.lab.name,
                  location: app.instrument.lab.location,
                }
              : null,
          }
        : null,
    }));

    return {
      data: formattedData,
      total,
      page,
      pageSize,
    };
  }

  async getMyApplications(userId: number, queryDto: QueryMyApplicationDto) {
    const { keyword, page = 1, pageSize = 10, status } = queryDto;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.instrument', 'instrument')
      .leftJoinAndSelect('instrument.lab', 'lab')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.reviewer', 'reviewer')
      .where('application.applicantId = :userId', { userId });

    // 关键词搜索（搜索仪器名称、申请目的、申请描述）
    if (keyword) {
      queryBuilder.andWhere(
        '(instrument.name LIKE :keyword OR application.purpose LIKE :keyword OR application.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 按状态筛选
    if (status !== undefined) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    // 按创建时间倒序排列
    queryBuilder.orderBy('application.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 获取数据和总数
    const [applications, total] = await queryBuilder.getManyAndCount();

    // 格式化返回数据
    const formattedData = applications.map((app) => ({
      id: app.id,
      purpose: app.purpose,
      description: app.description,
      startTime: app.startTime,
      endTime: app.endTime,
      status: app.status,
      rejectionReason: app.rejectionReason,
      reviewTime: app.reviewTime,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      // 简化申请人信息
      applicant: app.applicant
        ? {
            id: app.applicant.id,
            username: app.applicant.username,
            role: app.applicant.role,
          }
        : null,
      // 简化审核人信息
      reviewer: app.reviewer
        ? {
            id: app.reviewer.id,
            username: app.reviewer.username,
            role: app.reviewer.role,
          }
        : null,
      // 简化仪器信息并包含实验室
      instrument: app.instrument
        ? {
            id: app.instrument.id,
            name: app.instrument.name,
            serialNumber: app.instrument.serialNumber,
            model: app.instrument.model,
          }
        : null,
      lab: app.instrument.lab
        ? {
            id: app.instrument.lab.id,
            name: app.instrument.lab.name,
            location: app.instrument.lab.location,
          }
        : null,
    }));

    return {
      data: formattedData,
      total,
      page,
      pageSize,
    };
  }

  async getRepairs(status?: RepairStatus) {
    const queryBuilder = this.repairRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect('repair.instrument', 'instrument')
      .leftJoinAndSelect('repair.reporter', 'reporter')
      .leftJoinAndSelect('repair.assignee', 'assignee')
      .orderBy('repair.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('repair.status = :status', { status });
    }

    const repairs = await queryBuilder.getMany();

    // 使用 instanceToPlain 序列化数据，自动排除 @Exclude() 标记的字段（如密码）
    return instanceToPlain(repairs);
  }
}
