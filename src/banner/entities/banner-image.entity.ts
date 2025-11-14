import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Banner } from './banner.entity';

/**
 * 轮播图图片实体
 */
@Entity('banner_images')
export class BannerImage {
  @ApiProperty({ description: '图片ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '轮播图ID' })
  @Column()
  bannerId: number;

  @ApiProperty({ description: '图片URL' })
  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @ApiProperty({ description: '图片排序', default: 0 })
  @Column({ default: 0 })
  sort: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: '删除时间（软删除）' })
  @DeleteDateColumn()
  deletedAt: Date;

  // 关联关系
  @ManyToOne(() => Banner, (banner) => banner.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bannerId' })
  banner: Banner;
}
