import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseStatus } from '../../common/enums/status.enum';
import { Banner } from './banner.entity';

/**
 * 轮播图类型实体
 */
@Entity('banner_types')
export class BannerType {
  @ApiProperty({ description: '类型ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '类型名称', example: '首页轮播' })
  @Column({ length: 100, unique: true })
  name: string;

  @ApiProperty({ description: '类型描述', required: false })
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
  @ApiProperty({ description: '该类型下的轮播图列表', type: () => [Banner] })
  @OneToMany(() => Banner, (banner) => banner.type)
  banners: Banner[];
}
