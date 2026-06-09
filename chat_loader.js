import chatModule from "./chat_module.js";

export function loadChat(app){

    app.use("/api",chatModule);

}