import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Lab } from '../../lab/entities/lab.entity';

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn({ comment: '评价记录唯一标识' })
  id: number;

  @ManyToOne(() => Lab, (lab) => lab.evaluations)
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ comment: '实验室ID' })
  labId: number;

  @Column({ type: 'int', comment: '总体评分（1-5分）' })
  overallRating: number;

  @Column({ type: 'int', comment: '设备评分（1-5分）' })
  equipmentRating: number;

  @Column({ type: 'int', comment: '环境评分（1-5分）' })
  environmentRating: number;

  @Column({ type: 'int', comment: '服务评分（1-5分）' })
  serviceRating: number;

  @Column({ type: 'text', nullable: true, comment: '评价文字内容' })
  comment: string;

  @CreateDateColumn({ comment: '评价时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
