import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Lab } from '../../lab/entities/lab.entity';
import { InstrumentApplication } from './instrument-application.entity';
import { InstrumentRepair } from './instrument-repair.entity';
import { InstrumentStatus } from '../../common/enums/status.enum';

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn({ comment: '设备唯一标识' })
  id: number;

  @Column({ comment: '设备名称' })
  name: string;

  @Column({ comment: '设备型号' })
  model: string;

  @Column({ nullable: true, comment: '设备序列号' })
  serialNumber: string;

  @Column({ type: 'text', nullable: true, comment: '设备描述' })
  description: string;

  @Column({
    type: 'int',
    default: InstrumentStatus.ACTIVE,
    comment: '设备状态:0-正常,1-停用,2-维护中,3-故障',
  })
  status: InstrumentStatus;

  @Column({ type: 'text', nullable: true, comment: '设备技术规格' })
  specifications: string;

  @Column({ type: 'json', nullable: true, comment: '设备图片URL数组' })
  images: string[];

  @Column({ nullable: true, comment: '设备二维码' })
  qrCode: string;

  @ManyToOne(() => Lab, (lab) => lab.id, { nullable: true })
  @JoinColumn({ name: 'labId' })
  lab: Lab;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(
    () => InstrumentApplication,
    (application) => application.instrument,
  )
  applications: InstrumentApplication[];

  @OneToMany(() => InstrumentRepair, (repair) => repair.instrument)
  repairs: InstrumentRepair[];
}
