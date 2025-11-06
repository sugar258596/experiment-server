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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  repairNumber: string;

  @ManyToOne(() => Instrument, (instrument) => instrument.repairs)
  @JoinColumn()
  instrument: Instrument;

  @ManyToOne(() => User)
  @JoinColumn()
  reporter: User;

  @Column({ type: 'enum', enum: FaultType })
  faultType: FaultType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'enum', enum: UrgencyLevel, default: UrgencyLevel.MEDIUM })
  urgency: UrgencyLevel;

  @Column({ type: 'enum', enum: RepairStatus, default: RepairStatus.PENDING })
  status: RepairStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  assignee: User;

  @Column({ type: 'text', nullable: true })
  repairSummary: string;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
