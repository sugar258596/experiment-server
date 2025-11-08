import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { Status } from '../common/enums/status.enum';
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
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在(仅当邮箱不为空时检查)
    if (email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      email,
      phone,
      role,
      status: Status.ACTIVE,
    });

    await this.userRepository.save(user);

    // 生成token
    const token = this.generateToken(user);

    return {
      token,
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
    if (user.status !== Status.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 生成token
    const token = this.generateToken(user);

    return {
      token,
    };
  }

  private generateToken(user: User): string {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      email: user.email,
      status: user.status,
    };
    return this.jwtService.sign(payload);
  }
}
