'use strict';

const Service = require('egg').Service;

class DashboardService extends Service {
  /**
   * 获取面板统计数据
   * 基于实验室管理系统实际数据统计
   */
  async getPanelData() {
    const { ctx } = this;
    const { Op } = require('sequelize');

    // 统计实验室总数
    const totalLabs = await ctx.model.Lab.count();

    // 统计仪器总数
    const totalInstruments = await ctx.model.Instrument.count();

    // 统计今日预约数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await ctx.model.Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // 统计待处理的维修申请数
    const pendingRepairs = await ctx.model.Repair.count({
      where: {
        status: {
          [Op.in]: ['pending', 'processing'],
        },
      },
    });

    return {
      users: totalLabs,           // 实验室总数
      messages: totalInstruments, // 仪器总数
      moneys: todayAppointments,  // 今日预约
      shoppings: pendingRepairs,  // 待处理维修
    };
  }

  /**
   * 获取仪器状态分布数据
   * 统计不同状态的仪器数量
   */
  async getUserAccessSource() {
    const { ctx } = this;

    // 按状态统计仪器数量
    const instrumentsByStatus = await ctx.model.Instrument.findAll({
      attributes: [
        'status',
        [ctx.model.fn('COUNT', ctx.model.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // 转换为图表数据格式
    const statusMap = {
      available: '可用',
      in_use: '使用中',
      maintenance: '维护中',
      damaged: '损坏',
      retired: '已报废',
    };

    const data = instrumentsByStatus.map(item => ({
      name: statusMap[item.status] || item.status,
      value: parseInt(item.count),
    }));

    return data;
  }

  /**
   * 获取周预约统计数据
   * 统计最近7天的预约数量
   */
  async getWeeklyActivity() {
    const { ctx } = this;
    const { Op } = require('sequelize');

    // 获取最近7天的日期
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    // 按预约日期统计数量
    const appointments = await ctx.model.Appointment.findAll({
      attributes: [
        [ctx.model.fn('DATE', ctx.model.col('appointmentDate')), 'date'],
        [ctx.model.fn('COUNT', ctx.model.col('id')), 'count'],
      ],
      where: {
        appointmentDate: {
          [Op.between]: [weekAgo, today],
        },
      },
      group: [ctx.model.fn('DATE', ctx.model.col('appointmentDate'))],
      raw: true,
    });

    // 创建7天的数据数组
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = appointments.find(item => item.date === dateStr);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

      data.push({
        name: weekDays[dayIndex],
        value: dayData ? parseInt(dayData.count) : 0,
      });
    }

    return data;
  }

  /**
   * 获取月度使用统计数据
   * 统计每月的预约数和完成数
   */
  async getMonthlySales() {
    const { ctx } = this;
    const { Op } = require('sequelize');

    // 获取当前年份
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    // 按月统计预约总数
    const appointments = await ctx.model.Appointment.findAll({
      attributes: [
        [ctx.model.fn('MONTH', ctx.model.col('appointmentDate')), 'month'],
        [ctx.model.fn('COUNT', ctx.model.col('id')), 'count'],
      ],
      where: {
        appointmentDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [ctx.model.fn('MONTH', ctx.model.col('appointmentDate'))],
      raw: true,
    });

    // 按月统计已完成的预约数
    const completedAppointments = await ctx.model.Appointment.findAll({
      attributes: [
        [ctx.model.fn('MONTH', ctx.model.col('appointmentDate')), 'month'],
        [ctx.model.fn('COUNT', ctx.model.col('id')), 'count'],
      ],
      where: {
        appointmentDate: {
          [Op.between]: [startDate, endDate],
        },
        status: 'completed',
      },
      group: [ctx.model.fn('MONTH', ctx.model.col('appointmentDate'))],
      raw: true,
    });

    // 创建12个月的数据数组
    const estimate = []; // 预约总数
    const actual = [];   // 完成数

    for (let month = 1; month <= 12; month++) {
      const totalData = appointments.find(item => parseInt(item.month) === month);
      const completedData = completedAppointments.find(item => parseInt(item.month) === month);

      estimate.push(totalData ? parseInt(totalData.count) : 0);
      actual.push(completedData ? parseInt(completedData.count) : 0);
    }

    return {
      estimate,
      actual,
    };
  }
}

module.exports = DashboardService;
