import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from './entities/instrument.entity';
import { InstrumentApplication } from './entities/instrument-application.entity';
import { InstrumentRepair } from './entities/instrument-repair.entity';
import { ApplicationStatus, RepairStatus } from '../common/enums/status.enum';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { ApplyInstrumentDto } from './dto/apply-instrument.dto';
import { ReportInstrumentDto } from './dto/report-instrument.dto';
import { UserPayload } from '../common/interfaces/request.interface';
import { Lab } from '../lab/entities/lab.entity';

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

  async create(createInstrumentDto: CreateInstrumentDto): Promise<Instrument> {
    const { labId, ...dto } = createInstrumentDto;

    const instrument = this.instrumentRepository.create(dto);

    if (labId) {
      const lab = await this.labRepository.findOne({ where: { id: labId } });
      if (!lab) {
        throw new NotFoundException('所属实验室不存在');
      }
      instrument.lab = lab;
    }

    return await this.instrumentRepository.save(instrument);
  }

  async findAll(keyword?: string, labId?: string) {
    const queryBuilder = this.instrumentRepository
      .createQueryBuilder('instrument')
      .leftJoinAndSelect('instrument.lab', 'lab');

    if (keyword) {
      queryBuilder.andWhere(
        '(instrument.name LIKE :keyword OR instrument.model LIKE :keyword)',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    if (labId) {
      queryBuilder.andWhere('lab.id = :labId', { labId });
    }

    return await queryBuilder.getMany();
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
    const instrument = await this.findOne(instrumentId);

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

    return await this.applicationRepository.save(application);
  }

  async reviewApplication(
    applicationId: number,
    reviewer: UserPayload,
    approved: boolean,
    reason?: string,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['instrument'],
    });

    if (!application) {
      throw new NotFoundException('申请记录不存在');
    }

    application.status = approved
      ? ApplicationStatus.APPROVED
      : ApplicationStatus.REJECTED;
    application.reviewerId = reviewer.id;
    application.reviewTime = new Date();

    if (!approved && reason) {
      application.rejectionReason = reason;
    }

    return await this.applicationRepository.save(application);
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

  async getApplications(status?: ApplicationStatus) {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.instrument', 'instrument')
      .leftJoinAndSelect('application.applicant', 'applicant')
      .leftJoinAndSelect('application.reviewer', 'reviewer')
      .orderBy('application.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('application.status = :status', { status });
    }

    return await queryBuilder.getMany();
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

    return await queryBuilder.getMany();
  }
}
