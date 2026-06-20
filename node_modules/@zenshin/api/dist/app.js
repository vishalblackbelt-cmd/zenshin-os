"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const auth_js_1 = __importStar(require("./routes/auth.js"));
const students_js_1 = __importDefault(require("./routes/students.js"));
const attendance_js_1 = __importDefault(require("./routes/attendance.js"));
const trials_js_1 = __importDefault(require("./routes/trials.js"));
const billing_js_1 = __importDefault(require("./routes/billing.js"));
const audit_js_1 = __importDefault(require("./routes/audit.js"));
const cron_js_1 = require("./services/cron.js");
const auth_js_2 = require("./middleware/auth.js");
const app = (0, express_1.default)();
// Configure Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Mount Routes
app.use('/api/auth', auth_js_1.default);
app.use('/api/students', auth_js_2.authenticateToken, students_js_1.default);
app.use('/api/attendance', auth_js_2.authenticateToken, attendance_js_1.default);
app.use('/api/trials', auth_js_2.authenticateToken, trials_js_1.default);
app.use('/api/billing', auth_js_2.authenticateToken, billing_js_1.default);
app.use('/api/audit', auth_js_2.authenticateToken, audit_js_1.default);
// POST /api/cron/trigger
app.post('/api/cron/trigger', auth_js_2.authenticateToken, (0, auth_js_2.requireRole)(['OWNER', 'MANAGER']), async (req, res) => {
    try {
        const results = await (0, cron_js_1.runFinancialCron)();
        res.json({ message: 'Financial Discipline Cron Simulation completed', results });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to run financial cron simulation', details: error.message });
    }
});
// Root check endpoint
app.get('/', (req, res) => {
    res.json({ name: 'Zenshin OS API Service', version: '1.3.0-RC1', status: 'HEALTHY' });
});
// Bootstrap database
(0, auth_js_1.seedInitialDatabase)().then(() => {
    console.log('[Bootstrap] Initial database setup verification completed.');
});
exports.default = app;
