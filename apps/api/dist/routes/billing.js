"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const db_1 = require("@zenshin/db");
const whatsapp_js_1 = require("../services/whatsapp.js");
const router = (0, express_1.Router)();
// GET /api/billing/ledger
router.get('/ledger', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER', 'PARENT', 'STUDENT']), async (req, res) => {
    const { studentId } = req.query;
    try {
        const whereClause = {};
        if (studentId) {
            whereClause.studentId = studentId;
        }
        else if (req.user.role === 'MANAGER' && req.user.branchId) {
            whereClause.student = { branchId: req.user.branchId };
        }
        const entries = await db_js_1.prisma.ledgerEntry.findMany({
            where: whereClause,
            include: {
                student: { select: { name: true, branch: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(entries);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve ledger entries', details: error.message });
    }
});
// POST /api/billing/ledger
router.post('/ledger', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER']), auth_js_1.requireBranchAccess, async (req, res) => {
    const { studentId, type, amount, description } = req.body; // type: 'CHARGE' | 'PAYMENT'
    if (!studentId || !type || !amount || !description) {
        return res.status(400).json({ error: 'Missing required ledger entry parameters' });
    }
    try {
        const student = await db_js_1.prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const ledgerVal = type === 'CHARGE' ? db_1.LedgerEntryType.CHARGE : db_1.LedgerEntryType.PAYMENT;
        const ledgerAmount = parseInt(amount);
        const result = await db_js_1.prisma.$transaction(async (tx) => {
            // 1. Create ledger entry
            const entry = await tx.ledgerEntry.create({
                data: {
                    studentId,
                    type: ledgerVal,
                    amount: ledgerAmount,
                    description
                }
            });
            // 2. Fetch all ledger entries to compute correct balance (Never mutate!)
            const allEntries = await tx.ledgerEntry.findMany({
                where: { studentId }
            });
            const chargesSum = allEntries
                .filter(e => e.type === db_1.LedgerEntryType.CHARGE)
                .reduce((sum, e) => sum + e.amount, 0);
            const paymentsSum = allEntries
                .filter(e => e.type === db_1.LedgerEntryType.PAYMENT)
                .reduce((sum, e) => sum + e.amount, 0);
            const newBalance = chargesSum - paymentsSum;
            // 3. Reactivation checking:
            // If student is INACTIVE, and the new calculated balance is exactly zero, we reactivate them!
            let newStatus = student.status;
            let reactivationTriggered = false;
            if (student.status === db_1.StudentStatus.INACTIVE && newBalance <= 0) {
                newStatus = db_1.StudentStatus.ACTIVE;
                reactivationTriggered = true;
            }
            await tx.student.update({
                where: { id: studentId },
                data: {
                    outstandingBalance: newBalance,
                    status: newStatus
                }
            });
            // 4. Log audit log for transaction
            const actionName = ledgerVal === db_1.LedgerEntryType.CHARGE ? 'CHARGE_LOGGED' : 'PAYMENT_RECEIVED';
            await tx.auditLog.create({
                data: {
                    actor: req.user.email,
                    role: req.user.role,
                    action: actionName,
                    details: `Recorded ${ledgerVal} of ₹${ledgerAmount} for student ${studentId} (${description}).`,
                    branchId: student.branchId
                }
            });
            // 5. Log Timeline Event
            await tx.timelineEvent.create({
                data: {
                    studentId,
                    type: actionName,
                    description: `Recorded ${ledgerVal} of ₹${ledgerAmount}: ${description}`
                }
            });
            if (reactivationTriggered) {
                // Log reactivation audits and timeline
                await tx.auditLog.create({
                    data: {
                        actor: req.user.email,
                        role: req.user.role,
                        action: 'STUDENT_REACTIVATED',
                        details: `Reactivated suspended student ${student.name} (${studentId}) due to zero balance.`,
                        branchId: student.branchId
                    }
                });
                await tx.auditLog.create({
                    data: {
                        actor: req.user.email,
                        role: req.user.role,
                        action: 'WHATSAPP_RESTORED',
                        details: `Restored WhatsApp broadcasts for reactivated student ${studentId}.`,
                        branchId: student.branchId
                    }
                });
                await tx.timelineEvent.create({
                    data: {
                        studentId,
                        type: 'STUDENT_REACTIVATED',
                        description: 'Student reactivated automatically. Outstanding balance settled.'
                    }
                });
            }
            return { entry, newBalance, reactivationTriggered };
        });
        // If student reactivated, send whatsapp notification (outside transaction block)
        if (result.reactivationTriggered) {
            const whatsappMsg = `🎉 Welcome back! Reactivation complete for ${student.name} (${student.id}). All portal access, broadcasts, and dojo attendance options are successfully restored. Thank you for clearing the outstanding balance!`;
            await (0, whatsapp_js_1.sendWhatsAppMessage)(student.mobile, whatsappMsg, student.branchId);
        }
        res.status(201).json(result.entry);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record ledger entry', details: error.message });
    }
});
// GET /api/billing/settings
router.get('/settings', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER']), async (req, res) => {
    try {
        let settings = await db_js_1.prisma.settings.findUnique({ where: { id: 'global' } });
        if (!settings) {
            settings = await db_js_1.prisma.settings.create({
                data: { id: 'global', maxGracePeriod: 10, reactivationCharge: 1000 }
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve settings', details: error.message });
    }
});
// PUT /api/billing/settings
router.put('/settings', (0, auth_js_1.requireRole)(['OWNER']), async (req, res) => {
    const { maxGracePeriod, reactivationCharge } = req.body;
    if (maxGracePeriod === undefined || reactivationCharge === undefined) {
        return res.status(400).json({ error: 'Missing settings configuration parameters' });
    }
    try {
        const updated = await db_js_1.prisma.settings.upsert({
            where: { id: 'global' },
            update: {
                maxGracePeriod: parseInt(maxGracePeriod),
                reactivationCharge: parseInt(reactivationCharge)
            },
            create: {
                id: 'global',
                maxGracePeriod: parseInt(maxGracePeriod),
                reactivationCharge: parseInt(reactivationCharge)
            }
        });
        // Log setting change audit
        await db_js_1.prisma.auditLog.create({
            data: {
                actor: req.user.email,
                role: req.user.role,
                action: 'SETTINGS_CHANGED',
                details: `Modified Financial Discipline Settings: Max Grace Period = ${maxGracePeriod} days, Reactivation Fee = ₹${reactivationCharge}.`,
                branchId: null
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update configuration settings', details: error.message });
    }
});
// GET /api/billing/ledger/:id/receipt
router.get('/ledger/:id/receipt', (0, auth_js_1.requireRole)(['OWNER', 'MANAGER', 'PARENT', 'STUDENT']), async (req, res) => {
    const { id } = req.params;
    try {
        const entry = await db_js_1.prisma.ledgerEntry.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        parentName: true,
                        mobile: true,
                        branch: { select: { name: true } }
                    }
                }
            }
        });
        if (!entry) {
            return res.status(404).json({ error: 'Ledger entry not found' });
        }
        if (entry.type !== db_1.LedgerEntryType.PAYMENT) {
            return res.status(400).json({ error: 'Receipts can only be generated for payments' });
        }
        res.json({
            receiptId: entry.id,
            transactionDate: entry.createdAt,
            amount: entry.amount,
            description: entry.description,
            studentName: entry.student.name,
            studentId: entry.student.id,
            parentName: entry.student.parentName,
            mobile: entry.student.mobile,
            branch: entry.student.branch.name
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate receipt', details: error.message });
    }
});
exports.default = router;
