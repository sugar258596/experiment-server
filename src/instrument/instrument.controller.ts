import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InstrumentService } from './instrument.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { ApplyInstrumentDto } from './dto/apply-instrument.dto';
import { ReportInstrumentDto } from './dto/report-instrument.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicationStatus } from './entities/instrument-application.entity';
import { RepairStatus } from './entities/instrument-repair.entity';

@Controller('instruments')
export class InstrumentController {
  constructor(private readonly instrumentService: InstrumentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createInstrumentDto: CreateInstrumentDto) {
    return this.instrumentService.create(createInstrumentDto);
  }

  @Get()
  findAll(@Query('keyword') keyword?: string, @Query('labId') labId?: string) {
    return this.instrumentService.findAll(keyword, labId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instrumentService.findOne(id);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  apply(
    @Param('id') id: string,
    @Body() applyDto: ApplyInstrumentDto,
    @Req() req: any,
  ) {
    return this.instrumentService.apply(id, req.user, applyDto);
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard)
  getApplications(@Query('status') status?: ApplicationStatus) {
    return this.instrumentService.getApplications(status);
  }

  @Post('applications/:id/review')
  @UseGuards(JwtAuthGuard)
  reviewApplication(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @Body('reason') reason?: string,
    @Req() req?: any,
  ) {
    return this.instrumentService.reviewApplication(
      id,
      req.user,
      approved,
      reason,
    );
  }

  @Post(':id/repair')
  @UseGuards(JwtAuthGuard)
  report(
    @Param('id') id: string,
    @Body() reportDto: ReportInstrumentDto,
    @Req() req: any,
  ) {
    return this.instrumentService.report(id, req.user, reportDto);
  }

  @Get('repairs')
  @UseGuards(JwtAuthGuard)
  getRepairs(@Query('status') status?: RepairStatus) {
    return this.instrumentService.getRepairs(status);
  }

  @Post('repairs/:id/update')
  @UseGuards(JwtAuthGuard)
  updateRepairStatus(
    @Param('id') id: string,
    @Body('status') status: RepairStatus,
    @Body('summary') summary?: string,
  ) {
    return this.instrumentService.updateRepairStatus(id, status, summary);
  }
}
