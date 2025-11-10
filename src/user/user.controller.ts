import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { UpdateUserDto } from './dto/update-user.dto';
import { CheckExistenceDto } from './dto/check-existence.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators';

interface RequestWithUser extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@ApiTags('用户管理')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: '创建用户',
    description: '创建新的用户账号(仅管理员可操作)',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('check-existence')
  @Public()
  @ApiOperation({
    summary: '检查用户名或邮箱是否存在',
    description: '检查用户名或邮箱是否已被注册,用于注册时验证',
  })
  @ApiBody({ type: CheckExistenceDto })
  @ApiResponse({
    status: 200,
    description: '检查成功',
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'boolean',
          description: '用户名是否存在:true-存在,false-不存在',
        },
        email: {
          type: 'boolean',
          description: '邮箱是否存在:true-存在,false-不存在',
        },
      },
    },
  })
  checkExistence(@Body() checkExistenceDto: CheckExistenceDto) {
    return this.userService.checkExistence(checkExistenceDto);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息,包括个人资料、角色、状态等',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async getProfile(@Request() req: RequestWithUser) {
    return this.userService.getCurrentUser(req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: '获取所有用户',
    description: '查询所有用户列表(仅管理员可查看)',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据ID获取用户详细信息',
  })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息', description: '根据ID更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: '删除用户',
    description: '根据ID删除用户(仅管理员可操作)',
  })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
