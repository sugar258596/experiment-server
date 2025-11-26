import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { InstrumentApplication } from '../instrument/entities/instrument-application.entity';
import { Repair } from '../repair/entities/repair.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      User,
      Appointment,
      InstrumentApplication,
      Repair,
    ]),
    CommonModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
