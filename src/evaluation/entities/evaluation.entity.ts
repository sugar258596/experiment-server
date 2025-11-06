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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lab, (lab) => lab.evaluations)
  @JoinColumn()
  lab: Lab;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'int' })
  overallRating: number;

  @Column({ type: 'int' })
  equipmentRating: number;

  @Column({ type: 'int' })
  environmentRating: number;

  @Column({ type: 'int' })
  serviceRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
