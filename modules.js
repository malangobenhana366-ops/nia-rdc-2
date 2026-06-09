import uploadRoute from "./upload.js";

export function attachModules(app){
  app.use("/api", uploadRoute);
}