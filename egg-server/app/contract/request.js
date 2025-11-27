module.exports = {
  registerBody: {
    username: { type: 'string', required: true, description: '用户名' },
    password: { type: 'string', required: true, description: '密码' },
    email: { type: 'string', required: false, description: '邮箱' },
  },
  loginBody: {
    username: { type: 'string', required: true, description: '用户名' },
    password: { type: 'string', required: true, description: '密码' },
  },
  createBannerTypeBody: {
    name: { type: 'string', required: true, description: '类型名称' },
    description: { type: 'string', required: false, description: '类型描述' },
  },
  updateBannerTypeBody: {
    name: { type: 'string', required: false, description: '类型名称' },
    description: { type: 'string', required: false, description: '类型描述' },
  },
  createBannerBody: {
    typeId: { type: 'number', required: true, description: '类型ID' },
    title: { type: 'string', required: true, description: '标题' },
    link: { type: 'string', required: false, description: '链接' },
  },
  updateBannerBody: {
    typeId: { type: 'number', required: false, description: '类型ID' },
    title: { type: 'string', required: false, description: '标题' },
    link: { type: 'string', required: false, description: '链接' },
  },
  createUserBody: {
    username: { type: 'string', required: true, description: '用户名' },
    password: { type: 'string', required: true, description: '密码' },
    email: { type: 'string', required: false, description: '邮箱' },
  },
  updateUserBody: {
    username: { type: 'string', required: false, description: '用户名' },
    email: { type: 'string', required: false, description: '邮箱' },
  },
  createLabBody: {
    name: { type: 'string', required: true, description: '实验室名称' },
    location: { type: 'string', required: true, description: '位置' },
  },
  updateLabBody: {
    name: { type: 'string', required: false, description: '实验室名称' },
    location: { type: 'string', required: false, description: '位置' },
  },
  createAppointmentBody: {
    labId: { type: 'number', required: true, description: '实验室ID' },
    date: { type: 'string', required: true, description: '预约日期' },
  },
  updateAppointmentBody: {
    date: { type: 'string', required: false, description: '预约日期' },
  },
  reviewAppointmentBody: {
    status: { type: 'string', required: true, description: '审核状态' },
  },
  createInstrumentBody: {
    name: { type: 'string', required: true, description: '仪器名称' },
    labId: { type: 'number', required: true, description: '实验室ID' },
  },
  updateInstrumentBody: {
    name: { type: 'string', required: false, description: '仪器名称' },
  },
  createInstrumentApplicationBody: {
    instrumentId: { type: 'number', required: true, description: '仪器ID' },
  },
  reviewInstrumentApplicationBody: {
    status: { type: 'string', required: true, description: '审核状态' },
    rejectionReason: { type: 'string', required: false, description: '拒绝原因' },
  },
  createNewsBody: {
    title: { type: 'string', required: true, description: '标题' },
    content: { type: 'string', required: true, description: '内容' },
  },
  updateNewsBody: {
    title: { type: 'string', required: false, description: '标题' },
    content: { type: 'string', required: false, description: '内容' },
  },
  createEvaluationBody: {
    labId: { type: 'number', required: true, description: '实验室ID' },
    rating: { type: 'number', required: true, description: '评分' },
    content: { type: 'string', required: false, description: '评价内容' },
  },
  updateEvaluationBody: {
    rating: { type: 'number', required: false, description: '评分' },
    content: { type: 'string', required: false, description: '评价内容' },
  },
  createFavoriteBody: {
    labId: { type: 'number', required: true, description: '实验室ID' },
  },
  createRepairBody: {
    instrumentId: { type: 'number', required: true, description: '仪器ID' },
    description: { type: 'string', required: true, description: '故障描述' },
  },
  updateRepairBody: {
    status: { type: 'string', required: false, description: '维修状态' },
  },
};
