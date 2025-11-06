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

export enum AppointmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum TimeSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lab, (lab) => lab.appointments)
  @JoinColumn()
  lab: Lab;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'enum', enum: TimeSlot })
  timeSlot: TimeSlot;

  @Column({ type: 'text' })
  purpose: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  participantCount: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reviewer: User;

  @Column({ type: 'datetime', nullable: true })
  reviewTime: Date;

  @Column({ type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
