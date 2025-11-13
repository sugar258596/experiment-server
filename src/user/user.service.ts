import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { User } from './entities/user.entity';
import { Status } from '../common/enums/status.enum';
import { CheckExistenceDto } from './dto/check-existence.dto';
import { generateFileUrl, deleteFile } from '../config/upload.config';

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
        'teachingTags',
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
        'createdAt',
        'updatedAt',
        'teachingTags',
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
        'createdAt',
        'updatedAt',
        'teachingTags',
      ],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserByAdminDto): Promise<User> {
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
    // 使用软删除而非真正删除
    await this.userRepository.softRemove(user);
  }

  /**
   * 用户更新自己的个人信息
   * 只能修改基本信息，不能修改角色、状态、密码
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // 如果更新邮箱,需要检查新邮箱是否已被其他用户使用
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 更新用户信息（只更新允许的字段）
    const allowedFields: (keyof UpdateProfileDto)[] = [
      'nickname',
      'avatar',
      'email',
      'phone',
      'department',
      'teachingTags',
    ];

    allowedFields.forEach((field) => {
      if (updateProfileDto[field] !== undefined) {
        user[field] = updateProfileDto[field] as never;
      }
    });

    return await this.userRepository.save(user);
  }

  /**
   * 用户更新自己的个人信息（支持文件上传）
   * 只能修改基本信息，不能修改角色、状态、密码
   */
  async updateProfileWithFile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.findOne(userId);
    const oldAvatar = user.avatar;

    // 如果更新邮箱,需要检查新邮箱是否已被其他用户使用
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 处理头像更新逻辑
    let finalAvatar: string | undefined = oldAvatar;
    let shouldDeleteOldAvatar = false;

    // 判断avatar字段的类型
    if (file) {
      // 情况1：上传了新文件
      const avatarUrl = generateFileUrl('avatars', file.filename);
      finalAvatar = avatarUrl;
      shouldDeleteOldAvatar = true; // 需要删除旧头像
    } else if (updateProfileDto.avatar) {
      // 情况2：传入的是字符串（保持原有头像）
      finalAvatar = updateProfileDto.avatar;
      shouldDeleteOldAvatar = false;
    }

    // 删除旧头像文件（仅在重新上传时）
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
    }

    // 更新用户信息（只更新允许的字段）
    const allowedFields: (keyof UpdateProfileDto)[] = [
      'nickname',
      'email',
      'phone',
      'department',
      'teachingTags',
    ];

    allowedFields.forEach((field) => {
      if (updateProfileDto[field] !== undefined) {
        user[field] = updateProfileDto[field] as never;
      }
    });

    // 单独设置avatar
    user.avatar = finalAvatar;

    return await this.userRepository.save(user);
  }

  /**
   * 管理员更新用户信息
   * 可以修改角色、状态以及所有基本信息，但不能修改密码
   */
  async updateUserByAdmin(
    userId: number,
    updateUserByAdminDto: UpdateUserByAdminDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // 如果更新邮箱,需要检查新邮箱是否已被其他用户使用
    if (
      updateUserByAdminDto.email &&
      updateUserByAdminDto.email !== user.email
    ) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: updateUserByAdminDto.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 更新用户信息
    Object.assign(user, updateUserByAdminDto);
    return await this.userRepository.save(user);
  }

  /**
   * 管理员更新用户信息（支持文件上传）
   * 可以修改角色、状态以及所有基本信息，但不能修改密码
   */
  async updateUserByAdminWithFile(
    userId: number,
    updateUserByAdminDto: UpdateUserByAdminDto,
    file: Express.Multer.File,
  ) {
    const user = await this.findOne(userId);
    const oldAvatar = user.avatar;

    // 如果更新邮箱,需要检查新邮箱是否已被其他用户使用
    if (
      updateUserByAdminDto.email &&
      updateUserByAdminDto.email !== user.email
    ) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: updateUserByAdminDto.email },
      });

      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('邮箱已被其他用户使用');
      }
    }

    // 处理头像更新逻辑
    let finalAvatar: string | undefined = oldAvatar;
    let shouldDeleteOldAvatar = false;

    // 判断avatar字段的类型
    if (file) {
      // 情况1：上传了新文件
      const avatarUrl = generateFileUrl('avatars', file.filename);
      finalAvatar = avatarUrl;
      shouldDeleteOldAvatar = true; // 需要删除旧头像
    } else if (updateUserByAdminDto.avatar) {
      // 情况2：传入的是字符串（保持原有头像）
      finalAvatar = updateUserByAdminDto.avatar;
      shouldDeleteOldAvatar = false;
    }

    // 删除旧头像文件（仅在重新上传时）
    if (shouldDeleteOldAvatar && oldAvatar) {
      deleteFile(oldAvatar);
    }

    // 构建更新数据（排除avatar字段，因为已经单独处理）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { avatar: _avatar, ...updateData } = updateUserByAdminDto;

    // 更新用户信息
    Object.assign(user, {
      ...updateData,
      avatar: finalAvatar,
    });

    await this.userRepository.save(user);
    return {
      message: '更新成功',
    };
  }
}
