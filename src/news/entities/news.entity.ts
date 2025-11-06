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

export enum NewsStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('news')
export class News {
  @PrimaryGeneratedColumn({ comment: '新闻公告唯一标识' })
  id: number;

  @Column({ comment: '新闻标题' })
  title: string;

  @Column({ type: 'text', comment: '新闻内容' })
  content: string;

  @Column({ type: 'text', nullable: true, comment: '封面图片URL' })
  coverImage: string;

  @Column({ type: 'json', nullable: true, comment: '新闻图片URL数组' })
  images: string[];

  @Column({ type: 'json', nullable: true, comment: '新闻标签数组' })
  tags: string[];

  @Column({
    type: 'enum',
    enum: NewsStatus,
    default: NewsStatus.PENDING,
    comment: '新闻状态：PENDING-待审核，APPROVED-已发布，REJECTED-已拒绝',
  })
  status: NewsStatus;

  @Column({ type: 'int', default: 0, comment: '点赞数' })
  likes: number;

  @Column({ type: 'int', default: 0, comment: '收藏数' })
  favorites: number;

  @Column({ comment: '作者ID' })
  authorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
