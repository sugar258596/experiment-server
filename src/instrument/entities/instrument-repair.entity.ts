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

export enum RepairStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum FaultType {
  HARDWARE = 'HARDWARE',
  SOFTWARE = 'SOFTWARE',
  OPERATION_ERROR = 'OPERATION_ERROR',
  OTHER = 'OTHER',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('instrument_repairs')
export class InstrumentRepair {
  @PrimaryGeneratedColumn({ comment: '维修单唯一标识' })
  id: string;

  @Column({ unique: true, comment: '维修单号（唯一）' })
  repairNumber: string;

  @ManyToOne(() => Instrument, (instrument) => instrument.repairs)
  @JoinColumn({ name: 'instrumentId' })
  instrument: Instrument;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({
    type: 'enum',
    enum: FaultType,
    comment:
      '故障类型：HARDWARE-硬件故障，SOFTWARE-软件故障，OPERATION_ERROR-操作错误，OTHER-其他',
  })
  faultType: FaultType;

  @Column({ type: 'text', comment: '故障详细描述' })
  description: string;

  @Column({ type: 'json', nullable: true, comment: '故障图片URL数组' })
  images: string[];

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.MEDIUM,
    comment: '紧急程度：LOW-低，MEDIUM-中，HIGH-高，URGENT-紧急',
  })
  urgency: UrgencyLevel;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    default: RepairStatus.PENDING,
    comment: '维修状态：PENDING-待处理，IN_PROGRESS-维修中，COMPLETED-已完成',
  })
  status: RepairStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column({ type: 'text', nullable: true, comment: '维修总结' })
  repairSummary: string;

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  completedAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
