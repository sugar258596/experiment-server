import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, IsNull } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryAllNotificationsDto } from './dto/query-all-notifications.dto';
import { QueryMyNotificationsDto } from './dto/query-my-notifications.dto';
import { User } from '../user/entities/user.entity';
import { Status } from '../common/enums/status.enum';
import { Appointment } from '../appointment/entities/appointment.entity';
import { InstrumentApplication } from '../instrument/entities/instrument-application.entity';
import { Repair } from '../repair/entities/repair.entity';
import { NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(InstrumentApplication)
    private instrumentApplicationRepository: Repository<InstrumentApplication>,
    @InjectRepository(Repair)
    private repairRepository: Repository<Repair>,
  ) {}

  async create(createDto: CreateNotificationDto) {
    // 如果userId为0，向全体用户发送通知
    if (createDto.userId === 0) {
      // 查询所有用户
      const users = await this.userRepository.find({
        where: { status: Status.ACTIVE },
      });

      // 为每个用户创建通知
      const notifications = users.map((user) =>
        this.notificationRepository.create({
          user,
          type: createDto.type,
          title: createDto.title,
          content: createDto.content,
          relatedId: createDto.relatedId,
        }),
      );

      await this.notificationRepository.save(notifications);

      return {
        message: `已向 ${users.length} 位用户发送通知`,
      };
    }

    // 单个用户通知
    const user = await this.userRepository.findOne({
      where: { id: createDto.userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const notification = this.notificationRepository.create({
      user,
      type: createDto.type,
      title: createDto.title,
      content: createDto.content,
      relatedId: createDto.relatedId,
    });

    await this.notificationRepository.save(notification);
    return {
      message: '通知已发送',
    };
  }

  async findAllNotifications(query: QueryAllNotificationsDto) {
    const { keyword, userId, isRead, type, page = 1, pageSize = 10 } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user');

    // 关键字搜索（标题和内容）
    if (keyword) {
      queryBuilder.andWhere(
        '(notification.title LIKE :keyword OR notification.content LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 用户筛选（0表示所有用户）
    if (userId !== undefined && userId > 0) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    // 已读状态筛选
    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    // 通知类型筛选（不传递则查询所有类型）
    if (type !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 排序
    queryBuilder.orderBy('notification.createdAt', 'DESC');

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取数据
    const notifications = await queryBuilder.getMany();

    // 根据通知类型查询对应的详细信息
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        const notificationWithDetails: any = { ...notification };

        // 如果有 relatedId 且不为空，根据类型查询详细信息
        if (notification.relatedId) {
          try {
            switch (notification.type) {
              case NotificationType.APPOINTMENT_REVIEW:
              case NotificationType.APPOINTMENT_REMINDER: {
                // 查询预约信息
                const appointment = await this.appointmentRepository.findOne({
                  where: { id: notification.relatedId as any },
                });
                if (appointment) {
                  notificationWithDetails.relatedData = appointment;
                }
                break;
              }
              case NotificationType.INSTRUMENT_APPLICATION: {
                // 查询仪器申请信息
                const application =
                  await this.instrumentApplicationRepository.findOne({
                    where: { id: notification.relatedId as any },
                  });
                if (application) {
                  notificationWithDetails.relatedData = application;
                }
                break;
              }
              case NotificationType.REPAIR_PROGRESS: {
                // 查询维修信息
                const repair = await this.repairRepository.findOne({
                  where: { id: notification.relatedId as any },
                });
                if (repair) {
                  notificationWithDetails.relatedData = repair;
                }
                break;
              }
              case NotificationType.TEMPORARY_NOTICE:
              default:
                // 临时通知没有关联信息
                break;
            }
          } catch (error) {
            // 查询关联信息失败不影响通知的返回
            console.error('查询关联信息失败:', error);
          }
        }

        return notificationWithDetails;
      }),
    );

    return {
      data: notificationsWithDetails,
      total,
    };
  }

  async findMyNotifications(userId: number, query: QueryMyNotificationsDto) {
    const where: FindOptionsWhere<Notification> = {
      user: { id: userId },
      relatedId: Not(IsNull()),
      isRead: query.isRead,
    };

    if (query.type !== undefined) {
      where.type = query.type;
    }

    const notifications = await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // 根据通知类型查询对应的详细信息
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        const notificationWithDetails: any = { ...notification };

        // 如果有 relatedId 且不为空，根据类型查询详细信息
        if (notification.relatedId) {
          try {
            switch (notification.type) {
              case NotificationType.APPOINTMENT_REVIEW:
              case NotificationType.APPOINTMENT_REMINDER: {
                // 查询预约信息
                const appointment = await this.appointmentRepository.findOne({
                  where: { id: notification.relatedId as any },
                });
                if (appointment) {
                  notificationWithDetails.relatedData = appointment;
                }
                break;
              }
              case NotificationType.INSTRUMENT_APPLICATION: {
                // 查询仪器申请信息
                const application =
                  await this.instrumentApplicationRepository.findOne({
                    where: { id: notification.relatedId as any },
                  });
                if (application) {
                  notificationWithDetails.relatedData = application;
                }
                break;
              }
              case NotificationType.REPAIR_PROGRESS: {
                // 查询维修信息
                const repair = await this.repairRepository.findOne({
                  where: { id: notification.relatedId as any },
                });
                if (repair) {
                  notificationWithDetails.relatedData = repair;
                }
                break;
              }
              case NotificationType.TEMPORARY_NOTICE:
              default:
                // 临时通知没有关联信息
                break;
            }
          } catch (error) {
            // 查询关联信息失败不影响通知的返回
            console.error('查询关联信息失败:', error);
          }
        }

        return notificationWithDetails;
      }),
    );

    return notificationsWithDetails;
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number) {
    const notifications = await this.notificationRepository.find({
      where: { user: { id: userId }, isRead: false },
    });

    if (notifications.length > 0) {
      for (const notification of notifications) {
        notification.isRead = true;
      }
      await this.notificationRepository.save(notifications);
    }

    return { message: '所有通知已标记为已读' };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
    return { count };
  }

  async remove(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // 使用软删除而非真正删除
    await this.notificationRepository.softRemove(notification);
    return { message: '通知已删除' };
  }
}
