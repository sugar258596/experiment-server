import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryAllNotificationsDto } from './dto/query-all-notifications.dto';
import { QueryMyNotificationsDto } from './dto/query-my-notifications.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('通知管理')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({
    summary: '创建通知',
    description:
      '创建新的通知(系统内部使用)。用户ID为0时表示向全体用户发送通知',
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  create(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取我的通知',
    description:
      '查询当前用户的未读通知列表（只显示有关联记录的通知）。不传type参数默认查询所有类型，传isRead=true可查询已读通知',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findMyNotifications(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryMyNotificationsDto,
  ) {
    return this.notificationService.findMyNotifications(req.user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: '获取未读数量',
    description: '查询当前用户的未读通知数量',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取所有通知（管理员专用）',
    description:
      '查询所有通知（仅管理员可查看），支持关键字搜索、用户筛选和分页',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findAllNotifications(@Query() query: QueryAllNotificationsDto) {
    return this.notificationService.findAllNotifications(query);
  }

  @Patch('read/:id')
  @ApiOperation({
    summary: '标记为已读',
    description: '将指定通知标记为已读',
  })
  @ApiParam({ name: 'id', description: '通知ID', example: 'notification-001' })
  @ApiResponse({
    status: 200,
    description: '标记成功',
  })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: '全部标记为已读',
    description: '将当前用户所有未读通知标记为已读',
  })
  @ApiResponse({
    status: 200,
    description: '标记成功',
  })
  markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除通知',
    description: '删除指定通知',
  })
  @ApiParam({ name: 'id', description: '通知ID', example: 'notification-001' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.remove(id, req.user.id);
  }
}
