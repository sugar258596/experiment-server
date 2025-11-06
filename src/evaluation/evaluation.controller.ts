import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('实验室评价')
@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '提交实验室评价',
    description: '对实验室进行综合评价',
  })
  @ApiBody({ type: CreateEvaluationDto })
  @ApiResponse({
    status: 201,
    description: '评价提交成功',
  })
  create(@Body() createDto: CreateEvaluationDto, @Req() req: any) {
    return this.evaluationService.create(req.user, createDto);
  }

  @Get('lab/:labId')
  @ApiOperation({
    summary: '获取实验室评价',
    description: '查询指定实验室的所有评价',
  })
  @ApiParam({ name: 'labId', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findByLab(@Param('labId') labId: string) {
    return this.evaluationService.findByLab(labId);
  }

  @Get('lab/:labId/statistics')
  @ApiOperation({
    summary: '获取实验室评价统计',
    description: '查询指定实验室的评价统计数据',
  })
  @ApiParam({ name: 'labId', description: '实验室ID', example: 'lab-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getStatistics(@Param('labId') labId: string) {
    return this.evaluationService.getStatistics(labId);
  }
}
