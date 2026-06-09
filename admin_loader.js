import adminModule from "./admin_module.js";

export function loadAdmin(app) {
  app.use("/api", adminModule);
}