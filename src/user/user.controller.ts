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
import { JwtAuthGuard } from '../common/guards';
import { UpdateUserDto } from './dto/update-user.dto';

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
  @ApiOperation({ summary: '创建用户', description: '创建新的用户账号' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('profile')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '用户ID' },
        username: { type: 'string', description: '用户名' },
        nickname: { type: 'string', description: '用户昵称' },
        email: { type: 'string', description: '用户邮箱' },
        phone: { type: 'string', description: '用户手机号' },
        department: { type: 'string', description: '所属院系/部门' },
        role: { type: 'string', description: '用户角色' },
        status: { type: 'string', description: '用户状态' },
      },
    },
  })
  async getProfile(@Request() req: RequestWithUser) {
    return this.userService.getCurrentUser(req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取所有用户', description: '查询所有用户列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
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
  @ApiOperation({ summary: '删除用户', description: '根据ID删除用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
