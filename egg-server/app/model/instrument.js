'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT, JSON } = app.Sequelize;

  const Instrument = app.model.define('instruments', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true, comment: '设备唯一标识' },
    name: { type: STRING(100), allowNull: false, comment: '设备名称' },
    model: { type: STRING(100), allowNull: false, comment: '设备型号' },
    serialNumber: { type: STRING(100), allowNull: true, comment: '设备序列号' },
    description: { type: TEXT, allowNull: true, comment: '设备描述' },
    status: { type: INTEGER, defaultValue: 0, comment: '设备状态:0-正常,1-停用,2-维护中,3-故障,4-借出' },
    specifications: { type: TEXT, allowNull: true, comment: '设备技术规格' },
    images: { type: JSON, allowNull: true, comment: '设备图片URL数组' },
    qrCode: { type: STRING(500), allowNull: true, comment: '设备二维码' },
    labId: { type: INTEGER, allowNull: true, comment: '所属实验室ID' },
    createdAt: { type: DATE, allowNull: false, comment: '创建时间' },
    updatedAt: { type: DATE, allowNull: false, comment: '更新时间' },
    deletedAt: { type: DATE, allowNull: true, comment: '软删除时间' },
  }, {
    timestamps: true,
    paranoid: true,
    underscored: false,
  });

  Instrument.associate = () => {
    app.model.Instrument.belongsTo(app.model.Lab, { foreignKey: 'labId', as: 'lab' });
    app.model.Instrument.hasMany(app.model.InstrumentApplication, { foreignKey: 'instrumentId', as: 'applications' });
    app.model.Instrument.hasMany(app.model.Repair, { foreignKey: 'instrumentId', as: 'repairs' });
  };

  return Instrument;
};
