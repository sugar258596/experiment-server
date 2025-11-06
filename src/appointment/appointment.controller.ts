import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ReviewAppointmentDto } from './dto/review-appointment.dto';
import { SearchAppointmentDto } from './dto/search-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentService.create(req.user, createDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchAppointmentDto) {
    return this.appointmentService.findAll(searchDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyAppointments(@Req() req: any) {
    return this.appointmentService.findMyAppointments(req.user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  getPendingAppointments() {
    return this.appointmentService.getPendingAppointments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard)
  review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewAppointmentDto,
    @Req() req: any,
  ) {
    return this.appointmentService.review(id, req.user, reviewDto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.appointmentService.cancel(id, req.user);
  }
}
