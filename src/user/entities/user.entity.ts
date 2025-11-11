import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Favorites } from '../../favorites/entities/favorites.entity';
import { Evaluation } from '../../evaluation/entities/evaluation.entity';
import { News } from '../../news/entities/news.entity';
import { InstrumentApplication } from '../../instrument/entities/instrument-application.entity';
import { InstrumentRepair } from '../../instrument/entities/instrument-repair.entity';
import { Role } from '../../common/enums/role.enum';
import { Status } from '../../common/enums/status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ comment: '用户唯一标识' })
  id: number;

  @Column({ unique: true, nullable: false, comment: '用户名，唯一标识' })
  username: string;

  @Column({ comment: '用户密码(bcrypt加密)' })
  @Exclude() // 防止密码在API响应中泄露
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: Role.STUDENT,
    comment:
      '用户角色:student-学生,teacher-教师,admin-管理员,super_admin-超级管理员',
  })
  role: Role;

  @Column({
    type: 'int',
    default: Status.ACTIVE,
    comment: '用户状态:0-正常,1-禁用,2-封禁',
  })
  status: Status;

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

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: '教学标签数组(逗号分隔)',
  })
  teachingTags: string[];

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({ comment: '软删除时间' })
  deletedAt: Date;

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
