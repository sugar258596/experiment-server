'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    await app.model.sync();
  });

  app.ready(() => {
    const port = app.config.cluster.listen.port || 7001;
    console.log(`Server is running on port ${port}`);
    console.log(`Swagger API docs: http://localhost:${port}/swagger-ui.html`);
  });
};
