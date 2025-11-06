export enum Role {
  SUPER_ADMIN = 'super_admin', // 超级管理员
  ADMIN = 'admin', // 管理员
  STUDENT = 'student', // 学生
  TEACHER = 'teacher', // 老师
}

// 角色优先级，用于判断是否有权限操作其他用户的数据
export const RolePriority = {
  [Role.SUPER_ADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.TEACHER]: 2,
  [Role.STUDENT]: 1,
};

// 角色标签
export const RoleLabels = {
  [Role.SUPER_ADMIN]: '超级管理员',
  [Role.ADMIN]: '管理员',
  [Role.STUDENT]: '学生',
  [Role.TEACHER]: '老师',
};

// 管理员角色数组
export const AdminRoles = [Role.SUPER_ADMIN, Role.ADMIN];
