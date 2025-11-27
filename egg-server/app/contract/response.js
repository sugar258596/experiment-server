module.exports = {
  baseResponse: {
    success: { type: 'boolean', required: true, description: '是否成功' },
    message: { type: 'string', required: false, description: '消息' },
    data: { type: 'object', required: false, description: '数据' },
  },
};
