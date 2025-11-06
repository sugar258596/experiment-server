import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstrumentService } from './instrument.service';
import { InstrumentController } from './instrument.controller';
import { Instrument } from './entities/instrument.entity';
import { InstrumentApplication } from './entities/instrument-application.entity';
import { InstrumentRepair } from './entities/instrument-repair.entity';
import { Lab } from '../lab/entities/lab.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Instrument,
      InstrumentApplication,
      InstrumentRepair,
      Lab,
    ]),
    CommonModule,
  ],
  controllers: [InstrumentController],
  providers: [InstrumentService],
  exports: [InstrumentService],
})
export class InstrumentModule {}
