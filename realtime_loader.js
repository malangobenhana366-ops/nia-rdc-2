import realtimeModule from "./realtime_module.js";

export function loadRealtime(app){
    app.use("/api", realtimeModule);
}