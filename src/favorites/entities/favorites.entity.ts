import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Lab } from '../../lab/entities/lab.entity';

@Entity('favorites')
export class Favorites {
  @PrimaryGeneratedColumn({ comment: '收藏记录唯一标识' })
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Lab)
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ comment: '实验室ID' })
  labId: number;

  @CreateDateColumn({ comment: '收藏时间' })
  createdAt: Date;
}
