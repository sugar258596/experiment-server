import { SetMetadata } from '@nestjs/common';

export const CHECK_OWNERSHIP_KEY = 'checkOwnership';

export interface OwnershipCheckConfig {
  /**
   * 资源所有者ID在请求参数中的字段名
   */
  paramKey?: string;
  /**
   * 资源所有者ID在请求体中的字段名
   */
  bodyKey?: string;
  /**
   * 允许绕过所有权检查的角色
   */
  bypassRoles?: string[];
  /**
   * 自定义验证逻辑的服务方法名
   */
  customValidator?: string;
}

/**
 * 资源所有权检查装饰器
 * 用于检查当前用户是否有权访问指定资源
 */
export const CheckOwnership = (config: OwnershipCheckConfig = {}) =>
  SetMetadata(CHECK_OWNERSHIP_KEY, config);
