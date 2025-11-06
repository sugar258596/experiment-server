/**基础状态枚举 */
export enum BaseStatus {
  /**正常/启用 */
  ACTIVE = 0,
  /**禁用/异常 */
  INACTIVE = 1,
}

/**删除状态枚举 */
export enum DeleteStatus {
  /**未删除 */
  NOT_DELETED = 0,
  /**已删除 */
  DELETED = 1,
}

/**用户状态 */
export enum Status {
  /** 正常 */
  ACTIVE = BaseStatus.ACTIVE,
  /**禁用 */
  INACTIVE = BaseStatus.INACTIVE,
  /**封禁 */
  BANNED = 2,
}

/**公司状态 */
export enum CompanyStatus {
  /**正常 */
  ACTIVE = BaseStatus.ACTIVE,
  /**禁用 */
  INACTIVE = BaseStatus.INACTIVE,
}

/** 职位状态 */
export enum JobStatus {
  /**正常 */
  ACTIVE = BaseStatus.ACTIVE,
  /**禁用 */
  INACTIVE = BaseStatus.INACTIVE,
  /**已关闭 */
  CLOSED = 2,
}

/** 工作类型 */
export enum JobType {
  /**全职 */
  FULL_TIME = 0,
  /**兼职 */
  PART_TIME = 1,
  /**实习 */
  INTERNSHIP = 2,
}

/** 基础状态标签 */
export const BaseStatusLabels = {
  [BaseStatus.ACTIVE]: '正常',
  [BaseStatus.INACTIVE]: '禁用',
};

/** 删除状态标签 */
export const DeleteStatusLabels = {
  [DeleteStatus.NOT_DELETED]: '未删除',
  [DeleteStatus.DELETED]: '已删除',
};

/** 用户状态标签 */
export const StatusLabels = {
  [Status.ACTIVE]: '正常',
  [Status.INACTIVE]: '禁用',
  [Status.BANNED]: '封禁',
};

/**公司状态标签 */
export const CompanyStatusLabels = {
  [CompanyStatus.ACTIVE]: '正常',
  [CompanyStatus.INACTIVE]: '禁用',
};

/**职位状态标签 */
export const JobStatusLabels = {
  [JobStatus.ACTIVE]: '正常',
  [JobStatus.INACTIVE]: '禁用',
  [JobStatus.CLOSED]: '已关闭',
};

/** 工作类型标签 */
export const JobTypeLabels = {
  [JobType.FULL_TIME]: '全职',
  [JobType.PART_TIME]: '兼职',
  [JobType.INTERNSHIP]: '实习',
};

/** 在线状态枚举 */
export enum OnlineStatus {
  /**在线 */
  ONLINE = 0,
  /**离线 */
  OFFLINE = 1,
  /**其他 */
  OTHER = 2,
}

/** 在线状态标签 */
export const OnlineStatusLabels = {
  [OnlineStatus.ONLINE]: '在线',
  [OnlineStatus.OFFLINE]: '离线',
  [OnlineStatus.OTHER]: '其他',
};
