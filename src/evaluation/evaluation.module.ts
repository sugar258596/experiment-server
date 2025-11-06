import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { Evaluation } from './entities/evaluation.entity';
import { User } from '../user/entities/user.entity';
import { Lab } from '../lab/entities/lab.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, User, Lab]), CommonModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
