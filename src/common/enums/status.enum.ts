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

/** 预约状态枚举 */
export enum AppointmentStatus {
  /**待审核 */
  PENDING = 0,
  /**已通过 */
  APPROVED = 1,
  /**已拒绝 */
  REJECTED = 2,
  /**已取消 */
  CANCELLED = 3,
  /**已完成 */
  COMPLETED = 4,
}

/** 申请状态枚举 */
export enum ApplicationStatus {
  /**待审核 */
  PENDING = 0,
  /**已通过 */
  APPROVED = 1,
  /**已拒绝 */
  REJECTED = 2,
}

/** 维修状态枚举 */
export enum RepairStatus {
  /**待处理 */
  PENDING = 0,
  /**维修中 */
  IN_PROGRESS = 1,
  /**已完成 */
  COMPLETED = 2,
}

/** 新闻状态枚举 */
export enum NewsStatus {
  /**待审核 */
  PENDING = 0,
  /**已发布 */
  APPROVED = 1,
  /**已拒绝 */
  REJECTED = 2,
}

/** 实验室状态枚举 */
export enum LabStatus {
  /**正常 */
  ACTIVE = 0,
  /**维护中 */
  MAINTENANCE = 1,
  /**停用 */
  INACTIVE = 2,
}

/** 仪器状态枚举 */
export enum InstrumentStatus {
  /**正常 */
  ACTIVE = 0,
  /**停用 */
  INACTIVE = 1,
  /**维护中 */
  MAINTENANCE = 2,
  /**故障 */
  FAULT = 3,
  /** 借出 */
  BORROWED = 4,
}

/** 故障类型枚举 */
export enum FaultType {
  /**硬件故障 */
  HARDWARE = 0,
  /**软件故障 */
  SOFTWARE = 1,
  /**操作错误 */
  OPERATION_ERROR = 2,
  /**其他 */
  OTHER = 3,
}

/** 紧急程度枚举 */
export enum UrgencyLevel {
  /**低 */
  LOW = 0,
  /**中 */
  MEDIUM = 1,
  /**高 */
  HIGH = 2,
  /**紧急 */
  URGENT = 3,
}

/** 时间段枚举 */
export enum TimeSlot {
  /**上午 */
  MORNING = 0,
  /**下午 */
  AFTERNOON = 1,
  /**晚上 */
  EVENING = 2,
}

/** 预约状态标签 */
export const AppointmentStatusLabels = {
  [AppointmentStatus.PENDING]: '待审核',
  [AppointmentStatus.APPROVED]: '已通过',
  [AppointmentStatus.REJECTED]: '已拒绝',
  [AppointmentStatus.CANCELLED]: '已取消',
  [AppointmentStatus.COMPLETED]: '已完成',
};

/** 申请状态标签 */
export const ApplicationStatusLabels = {
  [ApplicationStatus.PENDING]: '待审核',
  [ApplicationStatus.APPROVED]: '已通过',
  [ApplicationStatus.REJECTED]: '已拒绝',
};

/** 维修状态标签 */
export const RepairStatusLabels = {
  [RepairStatus.PENDING]: '待处理',
  [RepairStatus.IN_PROGRESS]: '维修中',
  [RepairStatus.COMPLETED]: '已完成',
};

/** 新闻状态标签 */
export const NewsStatusLabels = {
  [NewsStatus.PENDING]: '待审核',
  [NewsStatus.APPROVED]: '已发布',
  [NewsStatus.REJECTED]: '已拒绝',
};

/** 实验室状态标签 */
export const LabStatusLabels = {
  [LabStatus.ACTIVE]: '正常',
  [LabStatus.MAINTENANCE]: '维护中',
  [LabStatus.INACTIVE]: '停用',
};

/** 仪器状态标签 */
export const InstrumentStatusLabels = {
  [InstrumentStatus.ACTIVE]: '正常',
  [InstrumentStatus.INACTIVE]: '停用',
  [InstrumentStatus.MAINTENANCE]: '维护中',
  [InstrumentStatus.FAULT]: '故障',
  [InstrumentStatus.BORROWED]: '借出',
};

/** 故障类型标签 */
export const FaultTypeLabels = {
  [FaultType.HARDWARE]: '硬件故障',
  [FaultType.SOFTWARE]: '软件故障',
  [FaultType.OPERATION_ERROR]: '操作错误',
  [FaultType.OTHER]: '其他',
};

/** 紧急程度标签 */
export const UrgencyLevelLabels = {
  [UrgencyLevel.LOW]: '低',
  [UrgencyLevel.MEDIUM]: '中',
  [UrgencyLevel.HIGH]: '高',
  [UrgencyLevel.URGENT]: '紧急',
};

/** 时间段标签 */
export const TimeSlotLabels = {
  [TimeSlot.MORNING]: '上午',
  [TimeSlot.AFTERNOON]: '下午',
  [TimeSlot.EVENING]: '晚上',
};
