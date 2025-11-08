import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Status } from '../common/enums/status.enum';
import { CheckExistenceDto } from './dto/check-existence.dto';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email } = createUserDto;

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

    const user = this.userRepository.create({
      ...createUserDto,
      status: Status.ACTIVE,
    });
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: [
        'id',
        'username',
        'nickname',
        'avatar',
        'email',
        'phone',
        'department',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'nickname',
        'avatar',
        'email',
        'phone',
        'department',
        'role',
        'status',
        'teachingTags',
        'auditTimeSlots',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`用户ID ${id} 不存在`);
    }

    return user;
  }

  async checkExistence(checkExistenceDto: CheckExistenceDto) {
    const { username, email } = checkExistenceDto;

    if (username) {
      const existingUserByUsername = await this.userRepository.findOne({
        where: { username },
        select: ['id'],
      });
      if (existingUserByUsername) {
        return { exists: 1 };
      }
    }

    if (email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email },
        select: ['id'],
      });
      if (existingUserByEmail) {
        return { exists: 1 };
      }
    }

    return { exists: 0 };
  }

  async getCurrentUser(jwtPayload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: jwtPayload.sub },
      select: [
        'id',
        'username',
        'nickname',
        'avatar',
        'email',
        'phone',
        'department',
        'role',
        'status',
        'teachingTags',
        'auditTimeSlots',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 如果更新邮箱,需要检查新邮箱是否已被其他用户使用
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== id) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
