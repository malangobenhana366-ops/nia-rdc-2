import feedModule from "./feed_module.js";

export function loadFeed(app) {
  app.use("/api", feedModule);
}