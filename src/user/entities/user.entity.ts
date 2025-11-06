import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Favorites } from '../../favorites/entities/favorites.entity';
import { Evaluation } from '../../evaluation/entities/evaluation.entity';
import { News } from '../../news/entities/news.entity';
import { InstrumentApplication } from '../../instrument/entities/instrument-application.entity';
import { InstrumentRepair } from '../../instrument/entities/instrument-repair.entity';

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'text', nullable: true })
  teachingTags: string[];

  @Column({ type: 'json', nullable: true })
  auditTimeSlots: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Favorites, (favorites) => favorites.user)
  favorites: Favorites[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.user)
  evaluations: Evaluation[];

  @OneToMany(() => News, (news) => news.author)
  news: News[];

  @OneToMany(
    () => InstrumentApplication,
    (application) => application.applicant,
  )
  instrumentApplications: InstrumentApplication[];

  @OneToMany(() => InstrumentRepair, (repair) => repair.reporter)
  instrumentRepairs: InstrumentRepair[];
}
