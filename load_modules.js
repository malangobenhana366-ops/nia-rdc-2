import vipModule from "./vip_module.js";

export function loadModules(app, db) {
  app.locals.db = db;

  app.use("/api", vipModule);
}