import favoriteModule from "./favorite_module.js";

export function loadFavorites(app){
  app.use("/api", favoriteModule);
}