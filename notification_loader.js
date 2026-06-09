import notificationModule from "./notification_module.js";

export function loadNotifications(app){
  app.use("/api", notificationModule);
}