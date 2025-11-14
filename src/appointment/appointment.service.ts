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

    // 转换日期格式为 MySQL DATE 类型兼容的格式 (YYYY-MM-DD)
    const appointmentDate = this.formatDateForMySQL(createDto.appointmentDate);

    // 检查时间冲突
    const hasConflict = await this.checkTimeConflict(
      createDto.labId,
      appointmentDate,
      createDto.timeSlot,
    );

    if (hasConflict) {
      throw new BadRequestException('该时间段已被预约');
    }

    const appointment = this.appointmentRepository.create({
      lab: { id: createDto.labId },
      user: { id: user.id },
      userId: user.id,
      appointmentDate: appointmentDate,
      timeSlot: createDto.timeSlot,
      purpose: createDto.purpose,
      description: createDto.description,
      participantCount: createDto.participantCount,
    });
    await this.appointmentRepository.save(appointment);
    return {
      message: '预约成功',
    };
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
      pageSize = 10,
    } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.lab', 'lab')
      .leftJoinAndSelect('appointment.user', 'user');

    if (status !== undefined) {
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
      .take(pageSize)
      .orderBy('appointment.createdAt', 'DESC');

    const [appointments, total] = await queryBuilder.getManyAndCount();

    // 直接映射实体数据，避免 any 类型
    const appointmentsWithLab = appointments.map((item) => ({
      id: item.id,
      lab: {
        id: item.lab?.id ?? 0,
        name: item.lab?.name ?? '',
        location: item.lab?.location,
        capacity: item.lab?.capacity,
        description: item.lab?.description,
        department: item.lab?.department,
        rating: item.lab?.rating,
      },
      user: {
        id: item.user.id,
        name: item.user.username,
      },
      timeSlot: item.timeSlot,
      appointmentDate: item.appointmentDate,
      purpose: item.purpose,
      description: item.description,
      participantCount: item.participantCount,
      status: item.status,
      createdAt: item.createdAt,
      rejectionReason: item.rejectionReason,
    }));

    return {
      data: appointmentsWithLab,
      total,
    };
  }

  async findMyAppointments(userId: number) {
    const appointments = await this.appointmentRepository.find({
      where: { user: { id: userId } },
      relations: ['lab', 'user'],
      order: { createdAt: 'DESC' },
    });

    const appointmentsWithLab = appointments.map((item) => ({
      id: item.id,
      lab: {
        id: item.lab.id,
        name: item.lab.name,
      },
      user: {
        id: item.user.id,
        name: item.user.username,
      },
      timeSlot: item.timeSlot,
      appointmentDate: item.appointmentDate,
      purpose: item.purpose,
      description: item.description,
      participantCount: item.participantCount,
      status: item.status,
      createdAt: item.createdAt,
      rejectionReason: item.rejectionReason,
    }));

    return appointmentsWithLab;
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['lab', 'user', 'reviewer'],
    });

    if (!appointment) {
      throw new NotFoundException(`预约记录ID ${id} 不存在`);
    }

    return appointment;
  }

  async finddetails(id: number) {
    const appointment = await this.findOne(id);

    const appointmentDetail = {
      id: appointment.id,
      lab: {
        id: appointment.lab.id,
        name: appointment.lab.name,
        location: appointment.lab.location,
        capacity: appointment.lab.capacity,
        description: appointment.lab.description,
        department: appointment.lab.department,
        rating: appointment.lab.rating,
      },
      user: {
        id: appointment.user.id,
        name: appointment.user.username,
      },
      timeSlot: appointment.timeSlot,
      appointmentDate: appointment.appointmentDate,
      purpose: appointment.purpose,
      description: appointment.description,
      participantCount: appointment.participantCount,
      status: appointment.status,
      createdAt: appointment.createdAt,
      reviewer: appointment.reviewer?.username,
      reviewTime: appointment.reviewTime,
    };

    return appointmentDetail;
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

    appointment.status = reviewDto.status;
    appointment.reviewerId = reviewer.id;
    appointment.reviewTime = new Date();

    if (reviewDto.status === AppointmentStatus.REJECTED && reviewDto.reason) {
      appointment.rejectionReason = reviewDto.reason;
    }

    await this.appointmentRepository.save(appointment);
    return {
      message: '审核成功',
    };
  }

  async cancel(id: number, user: UserPayload): Promise<Appointment> {
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
    date: string | Date,
    timeSlot: TimeSlot,
  ): Promise<boolean> {
    const appointmentDate = this.formatDateForMySQL(date);
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

  /**
   * 格式化日期为 MySQL DATE 类型兼容的格式 (YYYY-MM-DD)
   * 解决 MySQL 不支持 ISO 8601 格式(如:2024-01-15T00:00:00.000Z)的问题
   */
  private formatDateForMySQL(dateInput: string | Date): Date {
    // 如果是 Date 对象，直接使用
    if (dateInput instanceof Date) {
      return dateInput;
    }

    // 如果是字符串，解析并格式化
    const date = new Date(dateInput);

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      throw new BadRequestException('日期格式无效，请提供有效的日期');
    }

    return date;
  }

  async getPendingAppointments(searchDto: SearchAppointmentDto) {
    const {
      keyword,
      labId,
      userId,
      startDate,
      endDate,
      department,
      page = 1,
      pageSize = 10,
    } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.lab', 'lab')
      .leftJoinAndSelect('appointment.user', 'user')
      .where('appointment.status = :status', {
        status: AppointmentStatus.PENDING,
      });

    // 关键词搜索（搜索实验室名称、用户名、预约目的）
    if (keyword) {
      queryBuilder.andWhere(
        '(lab.name LIKE :keyword OR user.username LIKE :keyword OR appointment.purpose LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 实验室ID筛选
    if (labId) {
      queryBuilder.andWhere('lab.id = :labId', { labId });
    }

    // 用户ID筛选
    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    // 日期范围筛选
    if (startDate && endDate) {
      queryBuilder.andWhere(
        'appointment.appointmentDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    // 院系筛选
    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    // 分页和排序
    queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('appointment.createdAt', 'ASC');

    const [appointments, total] = await queryBuilder.getManyAndCount();

    // 直接映射实体数据，避免 any 类型
    const formattedAppointments = appointments.map((item) => ({
      id: item.id,
      lab: {
        id: item.lab?.id ?? 0,
        name: item.lab?.name ?? '',
        location: item.lab?.location ?? '',
      },
      user: {
        id: item.user?.id ?? 0,
        username: item.user?.username ?? '',
        department: item.user?.department,
      },
      timeSlot: item.timeSlot,
      appointmentDate: item.appointmentDate,
      purpose: item.purpose,
      description: item.description,
      participantCount: item.participantCount,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return {
      data: formattedAppointments,
      total,
    };
  }
}
