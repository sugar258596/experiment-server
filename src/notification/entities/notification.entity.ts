import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * 通知类型枚举
 * 0-预约审核, 1-临时通知, 2-预约提醒, 3-设备申请, 4-维修进度
 */
export enum NotificationType {
  APPOINTMENT_REVIEW = 0,
  TEMPORARY_NOTICE = 1,
  APPOINTMENT_REMINDER = 2,
  INSTRUMENT_APPLICATION = 3,
  REPAIR_PROGRESS = 4,
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ comment: '通知唯一标识' })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'int',
    comment: '通知类型:0-预约审核,1-临时通知,2-预约提醒,3-设备申请,4-维修进度',
  })
  type: number;

  @Column({ comment: '通知标题' })
  title: string;

  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @Column({ default: false, comment: '是否已读(false-未读,true-已读)' })
  isRead: boolean;

  @Column({ nullable: true, comment: '关联数据ID(如预约ID、设备申请ID等)' })
  relatedId: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({ comment: '软删除时间' })
  deletedAt: Date;
}
