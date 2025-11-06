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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ReviewAppointmentDto } from './dto/review-appointment.dto';
import { SearchAppointmentDto } from './dto/search-appointment.dto';
import { JwtAuthGuard } from 'src/common/guards';
import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';

@ApiTags('实验室预约')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建预约', description: '创建新的实验室预约' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({
    status: 201,
    description: '预约创建成功',
  })
  create(
    @Body() createDto: CreateAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.create(req.user, createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取预约列表', description: '查询所有预约记录' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAll(@Query() searchDto: SearchAppointmentDto) {
    return this.appointmentService.findAll(searchDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取我的预约',
    description: '查询当前用户的预约记录',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findMyAppointments(@Req() req: AuthenticatedRequest) {
    return this.appointmentService.findMyAppointments(req.user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取待审核预约',
    description: '查询待审核的预约（仅教师和管理员可查看）',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getPendingAppointments() {
    return this.appointmentService.getPendingAppointments();
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取预约详情',
    description: '根据ID获取预约详细信息',
  })
  @ApiParam({ name: 'id', description: '预约ID', example: 'appointment-001' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '审核预约',
    description: '审核实验室预约申请（仅教师和管理员可操作）',
  })
  @ApiParam({ name: 'id', description: '预约ID', example: 'appointment-001' })
  @ApiBody({ type: ReviewAppointmentDto })
  @ApiResponse({
    status: 200,
    description: '审核完成',
  })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.review(id, req.user, reviewDto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '取消预约',
    description: '取消已预约的实验室',
  })
  @ApiParam({ name: 'id', description: '预约ID', example: 'appointment-001' })
  @ApiResponse({
    status: 200,
    description: '取消成功',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.cancel(id, req.user);
  }
}
