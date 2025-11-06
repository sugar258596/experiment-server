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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  relatedId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
