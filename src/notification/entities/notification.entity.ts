import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  APPOINTMENT_REVIEW = 'APPOINTMENT_REVIEW',
  TEMPORARY_NOTICE = 'TEMPORARY_NOTICE',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  INSTRUMENT_APPLICATION = 'INSTRUMENT_APPLICATION',
  REPAIR_PROGRESS = 'REPAIR_PROGRESS',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ comment: '通知唯一标识' })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment:
      '通知类型：APPOINTMENT_REVIEW-预约审核，TEMPORARY_NOTICE-临时通知，APPOINTMENT_REMINDER-预约提醒，INSTRUMENT_APPLICATION-设备申请，REPAIR_PROGRESS-维修进度',
  })
  type: NotificationType;

  @Column({ comment: '通知标题' })
  title: string;

  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @Column({ default: false, comment: '是否已读（false-未读，true-已读）' })
  isRead: boolean;

  @Column({ nullable: true, comment: '关联数据ID（如预约ID、设备申请ID等）' })
  relatedId: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
