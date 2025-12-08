'use strict';

const Controller = require('egg').Controller;

/**
 * @controller Dashboard 统计
 */
class DashboardController extends Controller {
  /**
   * @summary 获取面板统计数据
   * @description 获取实验室总数、仪器总数、今日预约、待处理维修等统计数据
   * @router get /api/dashboard/panel
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getPanelData() {
    const { ctx } = this;
    const data = await ctx.service.dashboard.getPanelData();
    ctx.body = data
  }

  /**
   * @summary 获取仪器状态分布数据
   * @description 获取不同状态仪器的数量统计（饼图）
   * @router get /api/dashboard/user-access-source
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getUserAccessSource() {
    const { ctx } = this;
    const data = await ctx.service.dashboard.getUserAccessSource();
    ctx.body = data
  }

  /**
   * @summary 获取周预约统计数据
   * @description 获取最近7天每天的预约数量（柱状图）
   * @router get /api/dashboard/weekly-activity
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getWeeklyActivity() {
    const { ctx } = this;
    const data = await ctx.service.dashboard.getWeeklyActivity();
    ctx.body = data
  }

  /**
   * @summary 获取月度使用统计数据
   * @description 获取每月的预约总数和完成数（折线图）
   * @router get /api/dashboard/monthly-sales
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getMonthlySales() {
    const { ctx } = this;
    const data = await ctx.service.dashboard.getMonthlySales();
    ctx.body = data;
  }
}

module.exports = DashboardController;
