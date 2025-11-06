import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, password, email, phone, role } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      email,
      phone,
      role: role as UserRole,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    // 返回token和用户信息
    const token = this.generateToken(user);
    const { password: _, ...userInfo } = user;

    return {
      token,
      user: userInfo,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 生成token
    const token = this.generateToken(user);
    const { password: _, ...userInfo } = user;

    return {
      token,
      user: userInfo,
    };
  }

  private generateToken(user: User): string {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
