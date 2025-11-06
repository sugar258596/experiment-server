import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Instrument } from './instrument.entity';
import { User } from '../../user/entities/user.entity';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('instrument_applications')
export class InstrumentApplication {
  @PrimaryGeneratedColumn({ comment: '申请表唯一标识' })
  id: number;

  @ManyToOne(() => Instrument, (instrument) => instrument.applications)
  @JoinColumn({ name: 'instrumentId' })
  instrument: Instrument;

  @Column({ comment: '申请人ID' })
  applicantId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({ comment: '使用目的' })
  purpose: string;

  @Column({ type: 'text', comment: '详细描述' })
  description: string;

  @Column({ type: 'datetime', comment: '使用开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', comment: '使用结束时间' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
    comment: '申请状态：PENDING-待审核，APPROVED-已通过，REJECTED-已拒绝',
  })
  status: ApplicationStatus;

  @Column({ nullable: true, comment: '拒绝原因' })
  rejectionReason: string;

  @Column({ nullable: true, comment: '审核人ID' })
  reviewerId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  reviewTime: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
