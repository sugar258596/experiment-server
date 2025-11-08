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
import { LabStatus } from '../../common/enums/status.enum';

@Entity('labs')
export class Lab {
  @PrimaryGeneratedColumn({ comment: '实验室唯一标识' })
  id: number;

  @Column({ comment: '实验室名称' })
  name: string;

  @Column({ comment: '实验室位置' })
  location: string;

  @Column({ type: 'int', comment: '实验室容量（可容纳人数）' })
  capacity: number;

  @Column({ type: 'text', nullable: true, comment: '实验室描述' })
  description: string;

  @Column({ type: 'json', nullable: true, comment: '实验室图片URL数组' })
  images: string[];

  @Column({
    type: 'enum',
    enum: LabStatus,
    default: LabStatus.ACTIVE,
    comment: '实验室状态：0-正常,1-维护中,2-停用',
  })
  status: LabStatus;

  @Column({ comment: '所属院系/部门' })
  department: string;

  @Column({ type: 'json', nullable: true, comment: '设备清单数组' })
  equipmentList: string[];

  @Column({ type: 'json', nullable: true, comment: '实验室标签数组' })
  tags: string[];

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    comment: '实验室评分（0-5分,保留两位小数）',
  })
  rating: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.lab)
  appointments: Appointment[];

  @OneToMany(() => Favorites, (favorites) => favorites.lab)
  favorites: Favorites[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.lab)
  evaluations: Evaluation[];
}
