import dashboardModule from "./dashboard_module.js";

export function loadDashboard(app){
  app.use("/api", dashboardModule);
}