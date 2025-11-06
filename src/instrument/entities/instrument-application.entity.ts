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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Instrument, (instrument) => instrument.applications)
  @JoinColumn()
  instrument: Instrument;

  @ManyToOne(() => User)
  @JoinColumn()
  applicant: User;

  @Column()
  purpose: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reviewer: User;

  @Column({ type: 'datetime', nullable: true })
  reviewTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
