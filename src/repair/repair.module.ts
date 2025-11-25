import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairService } from './repair.service';
import { RepairController } from './repair.controller';
import { Repair } from './entities/repair.entity';
import { Instrument } from '../instrument/entities/instrument.entity';
import { CommonModule } from '../common/common.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repair, Instrument]),
    CommonModule,
    NotificationModule,
  ],
  controllers: [RepairController],
  providers: [RepairService],
  exports: [RepairService],
})
export class RepairModule {}
