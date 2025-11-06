/**
 * 统一错误消息常量
 * 所有错误提示使用中文，便于用户理解
 */

export const ErrorMessages = {
  // 认证相关
  AUTH: {
    UNAUTHORIZED: '未授权，请先登录',
    TOKEN_EXPIRED: '登录已过期，请重新登录',
    TOKEN_INVALID: '无效的登录凭证',
    PERMISSION_DENIED: '权限不足，无法执行此操作',
    LOGIN_FAILED: '用户名或密码错误',
    PASSWORD_INCORRECT: '密码错误',
    ACCOUNT_DISABLED: '账号已被禁用',
    ACCOUNT_BANNED: '账号已被封禁',
  },

  // 用户相关
  USER: {
    NOT_FOUND: '用户不存在',
    ALREADY_EXISTS: '用户已存在',
    EMAIL_EXISTS: '邮箱已被注册',
    USERNAME_EXISTS: '用户名已被使用',
    CANNOT_DELETE_SELF: '不能删除自己的账号',
    CANNOT_MODIFY_HIGHER_ROLE: '无法修改比自己权限更高的用户',
    INVALID_ROLE: '无效的角色',
  },

  // 管理员相关
  ADMIN: {
    NOT_FOUND: '管理员不存在',
    CANNOT_DELETE_SUPER: '不能删除超级管理员',
    CANNOT_MODIFY_SUPER: '不能修改超级管理员',
    ONLY_SUPER_ADMIN: '只有超级管理员可以执行此操作',
  },

  // 动态/帖子相关
  POST: {
    NOT_FOUND: '动态不存在',
    CANNOT_COMMENT: '该动态暂时无法评论',
    OWNER_ONLY: '只能操作自己发布的动态',
    ALREADY_LIKED: '已经点赞过了',
    NOT_LIKED: '还未点赞',
  },

  // 评论相关
  COMMENT: {
    NOT_FOUND: '评论不存在',
    PARENT_NOT_FOUND: '父评论不存在',
    OWNER_ONLY: '只能删除自己的评论',
    REPLY_USER_NOT_FOUND: '被回复的用户不存在',
    CANNOT_LIKE: '该评论暂时无法点赞',
  },

  // 公司相关
  COMPANY: {
    NOT_FOUND: '公司不存在',
    ALREADY_EXISTS: '公司已存在',
    NAME_EXISTS: '公司名称已被使用',
  },

  // 职位相关
  JOB: {
    NOT_FOUND: '职位不存在',
    ALREADY_APPLIED: '已经申请过该职位',
    APPLICATION_NOT_FOUND: '申请记录不存在',
    OWNER_ONLY: '只能操作自己发布的职位',
  },

  // 文件上传相关
  UPLOAD: {
    FILE_TOO_LARGE: '文件大小超过限制',
    INVALID_FILE_TYPE: '不支持的文件类型',
    UPLOAD_FAILED: '文件上传失败',
    FILE_NOT_FOUND: '文件不存在',
    TOO_MANY_FILES: '文件数量超过限制',
  },

  // 验证相关
  VALIDATION: {
    INVALID_INPUT: '输入数据格式不正确',
    REQUIRED_FIELD: '缺少必填字段',
    INVALID_EMAIL: '邮箱格式不正确',
    INVALID_PHONE: '手机号格式不正确',
    PASSWORD_TOO_SHORT: '密码长度至少8位',
    PASSWORD_TOO_WEAK: '密码强度不足',
  },

  // 系统相关
  SYSTEM: {
    INTERNAL_ERROR: '系统内部错误，请稍后重试',
    DATABASE_ERROR: '数据库操作失败',
    SERVICE_UNAVAILABLE: '服务暂时不可用',
    RATE_LIMIT: '请求过于频繁，请稍后再试',
  },

  // 通用
  COMMON: {
    NOT_FOUND: '资源不存在',
    INVALID_ID: '无效的ID',
    OPERATION_FAILED: '操作失败',
    ALREADY_EXISTS: '资源已存在',
    INVALID_PARAMS: '参数错误',
  },
};

export const SuccessMessages = {
  // 认证相关
  AUTH: {
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '退出登录成功',
    REGISTER_SUCCESS: '注册成功',
    PASSWORD_CHANGED: '密码修改成功',
  },

  // 用户相关
  USER: {
    CREATED: '用户创建成功',
    UPDATED: '用户信息更新成功',
    DELETED: '用户删除成功',
    BANNED: '用户已被封禁',
    UNBANNED: '用户已解除封禁',
  },

  // 动态相关
  POST: {
    CREATED: '动态发布成功',
    UPDATED: '动态更新成功',
    DELETED: '动态删除成功',
    LIKED: '点赞成功',
    UNLIKED: '取消点赞成功',
  },

  // 评论相关
  COMMENT: {
    CREATED: '评论成功，等待审核',
    DELETED: '评论删除成功',
    STATUS_UPDATED: '评论状态更新成功',
    APPROVED: '评论已通过审核',
    REJECTED: '评论已被驳回',
  },

  // 公司相关
  COMPANY: {
    CREATED: '公司创建成功',
    UPDATED: '公司信息更新成功',
    DELETED: '公司删除成功',
  },

  // 职位相关
  JOB: {
    CREATED: '职位发布成功',
    UPDATED: '职位信息更新成功',
    DELETED: '职位删除成功',
    APPLIED: '申请成功',
  },

  // 文件上传相关
  UPLOAD: {
    SUCCESS: '文件上传成功',
    DELETED: '文件删除成功',
  },

  // 通用
  COMMON: {
    SUCCESS: '操作成功',
    CREATED: '创建成功',
    UPDATED: '更新成功',
    DELETED: '删除成功',
  },
};
