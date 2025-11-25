import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RepairService } from './repair.service';
import { ReportRepairDto } from './dto/report-repair.dto';
import { QueryRepairDto } from './dto/query-repair.dto';
import { QueryMyRepairDto } from './dto/query-my-repair.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import type { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { Role } from 'src/common/enums/role.enum';
import { MultipleImageUpload } from 'src/common/decorators/upload.decorator';

@ApiTags('仪器维修管理')
@Controller('repairs')
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取维修记录',
    description:
      '查询仪器维修记录(仅管理员可查看)，支持关键词搜索（仪器名称）、状态筛选和分页',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功，返回分页数据',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  getRepairs(@Query() query: QueryRepairDto) {
    return this.repairService.getRepairs(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取我的维修记录',
    description:
      '查询当前登录用户提交的维修记录，支持关键词搜索（仪器名称）、状态筛选和分页',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功，返回分页数据',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        pageSize: { type: 'number', example: 10 },
      },
    },
  })
  getMyRepairs(
    @Query() query: QueryMyRepairDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.repairService.getMyRepairs(req.user.id, query);
  }

  @Post('report/:instrumentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @MultipleImageUpload('images', 5, 'repairs')
  @ApiOperation({
    summary: '报告仪器故障',
    description: '报告仪器设备故障并申请维修，支持上传最多5张图片',
  })
  @ApiBody({
    type: ReportRepairDto,
    description: '报告仪器故障表单数据（multipart/form-data），支持上传图片',
  })
  @ApiResponse({
    status: 201,
    description: '报告提交成功',
  })
  report(
    @Param('instrumentId', ParseIntPipe) instrumentId: number,
    @Body() reportDto: ReportRepairDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.repairService.report(instrumentId, req.user, reportDto, files);
  }

  @Post('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新维修状态',
    description: '更新仪器维修状态(仅管理员可操作)',
  })
  @ApiParam({ name: 'id', description: '维修记录ID', example: 1 })
  @ApiBody({ type: UpdateRepairStatusDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  updateRepairStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRepairStatusDto,
  ) {
    return this.repairService.updateRepairStatus(
      id,
      updateDto.status,
      updateDto.summary,
    );
  }
}
