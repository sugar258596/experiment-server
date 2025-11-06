import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Lab } from '../../lab/entities/lab.entity';
import { InstrumentApplication } from './instrument-application.entity';
import { InstrumentRepair } from './instrument-repair.entity';

export enum InstrumentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  FAULT = 'FAULT',
}

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: InstrumentStatus,
    default: InstrumentStatus.ACTIVE,
  })
  status: InstrumentStatus;

  @Column({ type: 'text', nullable: true })
  specifications: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ nullable: true })
  qrCode: string;

  @ManyToOne(() => Lab, (lab) => lab.id, { nullable: true })
  @JoinColumn()
  lab: Lab;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => InstrumentApplication,
    (application) => application.instrument,
  )
  applications: InstrumentApplication[];

  @OneToMany(() => InstrumentRepair, (repair) => repair.instrument)
  repairs: InstrumentRepair[];
}
