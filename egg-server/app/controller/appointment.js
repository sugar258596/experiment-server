'use strict';

const Controller = require('egg').Controller;

/**
 * @controller 预约管理
 */
class AppointmentController extends Controller {
  /**
   * @summary 获取预约列表
   * @description 查询所有预约
   * @router get /api/appointments
   * @response 200 baseResponse 查询成功
   */
  async index() {
    const { ctx } = this;
    const appointments = await ctx.service.appointment.findAll(ctx.query);
    ctx.body = { success: true, data: appointments };
  }

  /**
   * @summary 获取预约详情
   * @description 根据ID获取预约信息
   * @router get /api/appointments/{id}
   * @request path string *id
   * @response 200 baseResponse 查询成功
   */
  async show() {
    const { ctx } = this;
    const result = await ctx.service.appointment.findById(ctx.params.id);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 创建预约
   * @description 创建新预约
   * @router post /api/appointments
   * @request body createAppointmentBody *body
   * @response 200 baseResponse 创建成功
   */
  async create() {
    const { ctx } = this;
    const appointment = await ctx.service.appointment.create(ctx.request.body);
    ctx.body = { success: true, data: appointment };
  }

  /**
   * @summary 更新预约
   * @description 根据ID更新预约信息
   * @router put /api/appointments/{id}
   * @request path string *id
   * @request body updateAppointmentBody *body
   * @response 200 baseResponse 更新成功
   */
  async update() {
    const { ctx } = this;
    const result = await ctx.service.appointment.update(ctx.params.id, ctx.request.body);
    ctx.body = { success: true, data: result };
  }

  /**
   * @summary 审核预约
   * @description 审核预约申请
   * @router put /api/appointments/review/{id}
   * @request path string *id
   * @request body reviewAppointmentBody *body
   * @response 200 baseResponse 审核成功
   */
  async review() {
    const { ctx } = this;
    const appointment = await ctx.service.appointment.review(ctx.params.id, ctx.request.body);
    ctx.body = { success: true, data: appointment };
  }

  /**
   * @summary 取消预约
   * @description 根据ID取消预约
   * @router delete /api/appointments/{id}
   * @request path string *id
   * @response 200 baseResponse 取消成功
   */
  async destroy() {
    const { ctx } = this;
    await ctx.service.appointment.cancel(ctx.params.id, ctx.state.user.sub);
    ctx.body = { success: true, message: 'Appointment cancelled' };
  }

  /**
   * @summary 获取我的预约
   * @description 查询当前用户的预约记录
   * @router get /api/appointments/my
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async findMyAppointments() {
    const { ctx } = this;
    const userId = ctx.state.user.sub;

    const result = await ctx.service.appointment.findMyAppointments(userId);

    ctx.body = {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 获取待审核预约
   * @description 查询待审核的预约(仅教师和管理员可查看)
   * @router get /api/appointments/pending
   * @apikey
   * @response 200 baseResponse 查询成功
   */
  async getPendingAppointments() {
    const { ctx } = this;
    const result = await ctx.service.appointment.getPendingAppointments(ctx.query);

    ctx.body = {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 取消预约(PATCH方法)
   * @description 取消已预约的实验室
   * @router patch /api/appointments/cancel/{id}
   * @request path string *id
   * @apikey
   * @response 200 baseResponse 取消成功
   */
  async cancel() {
    const { ctx } = this;
    await ctx.service.appointment.cancel(ctx.params.id, ctx.state.user.sub);
    ctx.body = {
      success: true,
      message: '预约已取消',
    };
  }
}

module.exports = AppointmentController;
