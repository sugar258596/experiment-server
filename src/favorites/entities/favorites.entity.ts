import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Lab } from '../../lab/entities/lab.entity';

@Entity('favorites')
export class Favorites {
  @PrimaryGeneratedColumn({ comment: '收藏记录唯一标识' })
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Lab)
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @CreateDateColumn({ comment: '收藏时间' })
  createdAt: Date;
}
