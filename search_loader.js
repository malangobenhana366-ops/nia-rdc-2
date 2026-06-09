import searchModule from "./search_module.js";

export function loadSearch(app) {
  app.use("/api", searchModule);
}