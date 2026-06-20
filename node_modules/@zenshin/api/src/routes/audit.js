"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/audit
router.get('/', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER']), async (req, res) => {
    const user = req.user;
    try {
        const whereClause = {};
        if (user.role === 'MANAGER' && user.branchId) {
            whereClause.branchId = user.branchId;
        }
        const logs = await db_js_1.prisma.auditLog.findMany({
            where: whereClause,
            include: { branch: true },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve audit logs', details: error.message });
    }
});
exports.default = router;
