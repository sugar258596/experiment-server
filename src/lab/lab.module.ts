import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { Lab } from './entities/lab.entity';
import { Instrument } from '../instrument/entities/instrument.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lab, Instrument]), CommonModule],
  controllers: [LabController],
  providers: [LabService],
  exports: [LabService],
})
export class LabModule {}
