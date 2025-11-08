import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lab } from '../../lab/entities/lab.entity';
import { User } from '../../user/entities/user.entity';
import { AppointmentStatus, TimeSlot } from '../../common/enums/status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn({ comment: '预约单唯一标识' })
  id: number;

  @ManyToOne(() => Lab, (lab) => lab.appointments)
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ type: 'date', comment: '预约日期' })
  appointmentDate: Date;

  @Column({
    type: 'enum',
    enum: TimeSlot,
    comment: '时间段:0-上午,1-下午,2-晚上',
  })
  timeSlot: TimeSlot;

  @Column({ type: 'text', comment: '预约目的' })
  purpose: string;

  @Column({ type: 'text', comment: '详细描述' })
  description: string;

  @Column({ type: 'int', comment: '参与人数' })
  participantCount: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
    comment: '预约状态:0-待审核,1-已通过,2-已拒绝,3-已取消,4-已完成',
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true, comment: '拒绝原因' })
  rejectionReason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column({ nullable: true, comment: '审核人ID' })
  reviewerId: number;

  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  reviewTime: Date;

  @Column({ type: 'datetime', nullable: true, comment: '实际开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, comment: '实际结束时间' })
  endTime: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
