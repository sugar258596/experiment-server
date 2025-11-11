import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateNotificationDto) {
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

    return await this.notificationRepository.save(notification);
  }

  async findMyNotifications(userId: number, isRead?: boolean) {
    const where: FindOptionsWhere<Notification> = { user: { id: userId } };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
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
