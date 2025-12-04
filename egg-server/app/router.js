'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router } = app;

  // ==================== Swagger 文档重定向 ====================
  router.redirect('/', '/swagger-ui.html', 302);
  router.redirect('/swagger', '/swagger-ui.html', 302);

  // ==================== 加载模块路由 ====================
  require('./router/auth')(app);
  require('./router/user')(app);
  require('./router/lab')(app);
  require('./router/appointment')(app);
  require('./router/instrument')(app);
  require('./router/instrument-application')(app);
  require('./router/repair')(app);
  require('./router/news')(app);
  require('./router/notification')(app);
  require('./router/favorite')(app);
  require('./router/evaluation')(app);
};
