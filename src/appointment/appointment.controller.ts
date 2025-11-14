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
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Public, Roles } from 'src/common/decorators';
import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { Role } from 'src/common/enums/role.enum';

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
  @Public()
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取待审核预约',
    description:
      '查询待审核的预约(仅教师和管理员可查看)，支持关键词搜索、实验室ID筛选、用户ID筛选、日期范围筛选、院系筛选和分页',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功，返回分页数据',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  getPendingAppointments(@Query() searchDto: SearchAppointmentDto) {
    return this.appointmentService.getPendingAppointments(searchDto);
  }

  @Get(':id')
  @Public()
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
    return this.appointmentService.finddetails(id);
  }

  @Patch('review/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '审核预约',
    description: '审核实验室预约申请(仅教师和管理员可操作)',
  })
  @ApiParam({ name: 'id', description: '预约ID', example: 1 })
  @ApiBody({ type: ReviewAppointmentDto })
  @ApiResponse({
    status: 200,
    description: '审核完成',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.review(id, req.user, reviewDto);
  }

  @Patch('cancel/:id')
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
