import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Favorites } from '../../favorites/entities/favorites.entity';
import { Evaluation } from '../../evaluation/entities/evaluation.entity';

export enum LabStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

@Entity('labs')
export class Lab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'enum', enum: LabStatus, default: LabStatus.ACTIVE })
  status: LabStatus;

  @Column()
  department: string;

  @Column({ type: 'json', nullable: true })
  equipmentList: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.lab)
  appointments: Appointment[];

  @OneToMany(() => Favorites, (favorites) => favorites.lab)
  favorites: Favorites[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.lab)
  evaluations: Evaluation[];
}
