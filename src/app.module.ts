import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfigAsync, loadConfig, jwtConfig } from './config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LabModule } from './lab/lab.module';
import { InstrumentModule } from './instrument/instrument.module';
import { AppointmentModule } from './appointment/appointment.module';
import { NewsModule } from './news/news.module';
import { NotificationModule } from './notification/notification.module';
import { FavoritesModule } from './favorites/favorites.module';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      isGlobal: true, //全局
    }),
    JwtModule.register(jwtConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return getDatabaseConfigAsync(configService);
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    LabModule,
    InstrumentModule,
    AppointmentModule,
    NewsModule,
    NotificationModule,
    FavoritesModule,
    EvaluationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
