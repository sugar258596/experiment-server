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
import { Instrument } from './instrument.entity';
import { User } from '../../user/entities/user.entity';
import {
  FaultType,
  UrgencyLevel,
  RepairStatus,
} from 'src/common/enums/status.enum';

@Entity('instrument_repairs')
export class InstrumentRepair {
  @PrimaryGeneratedColumn({ comment: '维修单唯一标识' })
  id: number;

  @Column({ unique: true, comment: '维修单号(唯一)' })
  repairNumber: string;

  @ManyToOne(() => Instrument, (instrument) => instrument.repairs)
  @JoinColumn({ name: 'instrumentId' })
  instrument: Instrument;

  @Column({ comment: '报告人ID' })
  reporterId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({
    type: 'int',
    comment: '故障类型:0-硬件故障,1-软件故障,2-操作错误,3-其他',
  })
  faultType: FaultType;

  @Column({ type: 'text', comment: '故障详细描述' })
  description: string;

  @Column({ type: 'json', nullable: true, comment: '故障图片URL数组' })
  images: string[];

  @Column({
    type: 'int',
    default: UrgencyLevel.MEDIUM,
    comment: '紧急程度:0-低,1-中,2-高,3-紧急',
  })
  urgency: UrgencyLevel;

  @Column({
    type: 'int',
    default: RepairStatus.PENDING,
    comment: '维修状态:0-待处理,1-维修中,3-已完成',
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

  @DeleteDateColumn({ comment: '软删除时间' })
  deletedAt: Date;
}
