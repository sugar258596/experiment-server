import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus, TimeSlot } from '../common/enums/status.enum';
import { Role } from '../common/enums/role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ReviewAppointmentDto } from './dto/review-appointment.dto';
import { SearchAppointmentDto } from './dto/search-appointment.dto';
import { Lab } from '../lab/entities/lab.entity';
import type { UserPayload } from '../common/interfaces/request.interface';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(user: UserPayload, createDto: CreateAppointmentDto) {
    const lab = await this.labRepository.findOne({
      where: { id: createDto.labId },
    });

    if (!lab) {
      throw new NotFoundException('实验室不存在');
    }

    // 检查时间冲突
    const hasConflict = await this.checkTimeConflict(
      createDto.labId,
      createDto.appointmentDate,
      createDto.timeSlot,
    );

    if (hasConflict) {
      throw new BadRequestException('该时间段已被预约');
    }

    const appointment = this.appointmentRepository.create({
      lab,
      userId: user.id,
      appointmentDate: createDto.appointmentDate,
      timeSlot: createDto.timeSlot,
      purpose: createDto.purpose,
      description: createDto.description,
      participantCount: createDto.participantCount,
    });

    return await this.appointmentRepository.save(appointment);
  }

  async findAll(searchDto: SearchAppointmentDto) {
    const {
      status,
      labId,
      userId,
      startDate,
      endDate,
      department,
      page = 1,
      limit = 10,
    } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.lab', 'lab')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('appointment.reviewer', 'reviewer');

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    if (labId) {
      queryBuilder.andWhere('lab.id = :labId', { labId });
    }

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'appointment.appointmentDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('appointment.createdAt', 'DESC');

    const [appointments, total] = await queryBuilder.getManyAndCount();

    return {
      data: appointments,
      total,
      page,
      limit,
    };
  }

  async findMyAppointments(userId: number) {
    return await this.appointmentRepository.find({
      where: { user: { id: userId } },
      relations: ['lab'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['lab', 'user', 'reviewer'],
    });

    if (!appointment) {
      throw new NotFoundException(`预约记录ID ${id} 不存在`);
    }

    return appointment;
  }

  async review(
    id: number,
    reviewer: UserPayload,
    reviewDto: ReviewAppointmentDto,
  ) {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('只能审核待审核状态的预约');
    }

    appointment.status = reviewDto.approved
      ? AppointmentStatus.APPROVED
      : AppointmentStatus.REJECTED;
    appointment.reviewerId = reviewer.id;
    appointment.reviewTime = new Date();

    if (!reviewDto.approved && reviewDto.reason) {
      appointment.rejectionReason = reviewDto.reason;
    }

    return await this.appointmentRepository.save(appointment);
  }

  async cancel(id: number, user: UserPayload) {
    const appointment = await this.findOne(id);

    if (
      appointment.userId !== user.id &&
      user.role !== Role.TEACHER &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException('只能取消自己的预约');
    }

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException('该预约已结束或已取消');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return await this.appointmentRepository.save(appointment);
  }

  private async checkTimeConflict(
    id: number,
    date: string,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    const appointmentDate = new Date(date);
    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        lab: { id },
        appointmentDate,
        timeSlot,
        status: AppointmentStatus.APPROVED,
      },
    });

    return !!existingAppointment;
  }

  async getPendingAppointments() {
    return await this.appointmentRepository.find({
      where: { status: AppointmentStatus.PENDING },
      relations: ['lab', 'user'],
      order: { createdAt: 'ASC' },
    });
  }
}
