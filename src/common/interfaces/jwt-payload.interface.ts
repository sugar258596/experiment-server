import { Role } from '../enums/role.enum';

/**
 * JWT Payload 接口
 */
export interface JwtPayload {
  sub: number; // 用户ID
  username: string; // 用户名
  email?: string; // 邮箱
  role: Role; // 用户角色
  status?: number; // 用户状态
  iat?: number; // 签发时间
  exp?: number; // 过期时间
}

/**
 * 请求中的用户信息接口
 */
export interface RequestUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  status: number;
}
