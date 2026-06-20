"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const cron_js_1 = require("./services/cron.js");
const PORT = process.env.PORT || 4000;
app_js_1.default.listen(PORT, () => {
    console.log(`[Server] Zenshin OS API running at http://localhost:${PORT}`);
    // Start Cron checker
    (0, cron_js_1.startCronScheduler)();
});
