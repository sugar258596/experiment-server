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
  @PrimaryGeneratedColumn({ comment: '用户唯一标识' })
  id: string;

  @Column({ unique: true, comment: '用户名，唯一标识' })
  username: string;

  @Column({ comment: '用户密码（bcrypt加密）' })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
    comment: '用户角色：STUDENT-学生，TEACHER-教师，ADMIN-管理员',
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    comment: '用户状态：ACTIVE-正常，INACTIVE-禁用',
  })
  status: UserStatus;

  @Column({ nullable: true, comment: '用户昵称' })
  nickname: string;

  @Column({ nullable: true, comment: '用户头像URL' })
  avatar: string;

  @Column({ nullable: true, comment: '用户邮箱' })
  email: string;

  @Column({ nullable: true, comment: '用户手机号' })
  phone: string;

  @Column({ nullable: true, comment: '所属院系/部门' })
  department: string;

  @Column({ type: 'text', nullable: true, comment: '教学标签数组' })
  teachingTags: string[];

  @Column({
    type: 'json',
    nullable: true,
    comment: '审核时间段配置（JSON格式）',
  })
  auditTimeSlots: any;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
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
