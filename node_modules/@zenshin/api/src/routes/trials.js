"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const db_1 = require("@zenshin/db");
const router = (0, express_1.Router)();
// GET /api/trials
router.get('/', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER']), async (req, res) => {
    const user = req.user;
    let branchFilter = req.query.branch;
    try {
        if (user.role === 'MANAGER' && user.branchId) {
            const userBranch = await db_js_1.prisma.branch.findUnique({ where: { id: user.branchId } });
            branchFilter = userBranch?.name || '';
        }
        const whereClause = {};
        if (branchFilter) {
            whereClause.branch = { name: branchFilter };
        }
        const leads = await db_js_1.prisma.trialLead.findMany({
            where: whereClause,
            include: { branch: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve trial leads', details: error.message });
    }
});
// POST /api/trials
router.post('/', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER']), auth_js_1.requireBranchAccess, async (req, res) => {
    const { name, mobile, branchName, payMandatory } = req.body; // payMandatory: 'yes' | 'no'
    if (!name || !mobile || !branchName) {
        return res.status(400).json({ error: 'Missing required trial lead details' });
    }
    try {
        const branch = await db_js_1.prisma.branch.findUnique({ where: { name: branchName } });
        if (!branch) {
            return res.status(400).json({ error: 'Invalid branch name specified' });
        }
        const status = payMandatory === 'yes' ? db_1.TrialStatus.PAID : db_1.TrialStatus.NEW;
        const paidAmount = payMandatory === 'yes' ? 500 : 0;
        const lead = await db_js_1.prisma.$transaction(async (tx) => {
            const created = await tx.trialLead.create({
                data: {
                    name,
                    mobile,
                    branchId: branch.id,
                    status,
                    paidAmount
                }
            });
            await tx.auditLog.create({
                data: {
                    actor: req.user.email,
                    role: req.user.role,
                    action: 'TRIAL_ADD',
                    details: `Registered trial lead ${name} (${status}) for branch ${branchName}.`,
                    branchId: branch.id
                }
            });
            return created;
        });
        res.status(201).json(lead);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create trial lead', details: error.message });
    }
});
// PUT /api/trials/:id/status
router.put('/:id/status', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // TrialStatus
    if (!status) {
        return res.status(400).json({ error: 'Target status parameter is required' });
    }
    try {
        const lead = await db_js_1.prisma.trialLead.findUnique({ where: { id } });
        if (!lead) {
            return res.status(404).json({ error: 'Trial lead not found' });
        }
        // Enforce billing: Can convert to JOINED only if payment status is PAID (i.e. lead.paidAmount >= 500)
        if (status === 'JOINED' && lead.paidAmount < 500 && lead.status !== 'PAID') {
            return res.status(400).json({ error: 'Lead cannot convert to JOINED. The ₹500 mandatory trial fee must be PAID first!' });
        }
        const updated = await db_js_1.prisma.$transaction(async (tx) => {
            let paidAmount = lead.paidAmount;
            if (status === 'PAID') {
                paidAmount = 500;
            }
            const leadUpdated = await tx.trialLead.update({
                where: { id },
                data: {
                    status: status,
                    paidAmount
                }
            });
            await tx.auditLog.create({
                data: {
                    actor: req.user.email,
                    role: req.user.role,
                    action: 'TRIAL_UPDATE',
                    details: `Updated trial lead ${lead.name} status to ${status}.`,
                    branchId: lead.branchId
                }
            });
            return leadUpdated;
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update trial lead status', details: error.message });
    }
});
exports.default = router;
