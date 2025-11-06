import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateEvaluationDto, @Req() req: any) {
    return this.evaluationService.create(req.user, createDto);
  }

  @Get('lab/:labId')
  findByLab(@Param('labId') labId: string) {
    return this.evaluationService.findByLab(labId);
  }

  @Get('lab/:labId/statistics')
  getStatistics(@Param('labId') labId: string) {
    return this.evaluationService.getStatistics(labId);
  }
}
