import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BannerType } from './banner-type.entity';
import { BannerImage } from './banner-image.entity';
import { BaseStatus } from '../../common/enums/status.enum';

/**
 * 轮播图实体
 */
@Entity('banners')
export class Banner {
  @ApiProperty({ description: '轮播图ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '轮播图标题' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '轮播图类型ID' })
  @Column()
  typeId: number;

  @ApiProperty({ description: '链接地址', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string;

  @ApiProperty({ description: '描述信息', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '排序值', default: 0 })
  @Column({ default: 0 })
  sort: number;

  @ApiProperty({
    description: '状态：0-启用，1-禁用',
    enum: BaseStatus,
    default: BaseStatus.ACTIVE,
  })
  @Column({ type: 'tinyint', default: BaseStatus.ACTIVE })
  status: BaseStatus;

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
  @ApiProperty({ description: '轮播图类型', type: () => BannerType })
  @ManyToOne(() => BannerType, (type) => type.banners, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'typeId' })
  type: BannerType;

  @ApiProperty({ description: '轮播图图片列表', type: () => [BannerImage] })
  @OneToMany(() => BannerImage, (image) => image.banner, {
    cascade: true,
  })
  images: BannerImage[];
}
