import annonceModule from "./annonce_module.js";

export function loadAnnonce(app){
  app.use("/api", annonceModule);
}