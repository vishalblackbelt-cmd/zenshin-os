"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFinancialCron = runFinancialCron;
exports.startCronScheduler = startCronScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const db_js_1 = require("../db.js");
const whatsapp_js_1 = require("./whatsapp.js");
async function runFinancialCron() {
    console.log('[Financial Discipline Cron] Starting engine check...');
    // Load settings
    let settings = await db_js_1.prisma.settings.findUnique({ where: { id: 'global' } });
    if (!settings) {
        settings = await db_js_1.prisma.settings.create({
            data: { id: 'global', maxGracePeriod: 10, reactivationCharge: 1000 }
        });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Fetch all active students
    const activeStudents = await db_js_1.prisma.student.findMany({
        where: { status: 'ACTIVE' }
    });
    let suspensions = 0;
    let friendlyReminders = 0;
    let overdueReminders = 0;
    for (const student of activeStudents) {
        const dueDate = new Date(student.feeDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days until due date
        // Case 1: Suspension trigger (10 days overdue, diffDays <= -maxGracePeriod)
        if (diffDays <= -settings.maxGracePeriod) {
            suspensions++;
            const chargeAmount = settings.reactivationCharge;
            // Update student outstanding balance and status to INACTIVE
            await db_js_1.prisma.$transaction([
                db_js_1.prisma.student.update({
                    where: { id: student.id },
                    data: {
                        status: 'INACTIVE',
                        outstandingBalance: { increment: chargeAmount }
                    }
                }),
                // Add Reactivation Charge to ledger
                db_js_1.prisma.ledgerEntry.create({
                    data: {
                        studentId: student.id,
                        type: 'CHARGE',
                        amount: chargeAmount,
                        description: `Reactivation Charge (Suspension: overdue by ${Math.abs(diffDays)} days)`
                    }
                }),
                // Log to Student Timeline
                db_js_1.prisma.timelineEvent.create({
                    data: {
                        studentId: student.id,
                        type: 'STUDENT_SUSPENDED',
                        description: `Suspended automatically. Reactivation fee of ₹${chargeAmount} charged.`
                    }
                }),
                // Log Audit Log - Suspension
                db_js_1.prisma.auditLog.create({
                    data: {
                        actor: 'CRON_ENGINE',
                        role: 'OWNER',
                        action: 'STUDENT_SUSPENDED',
                        details: `Suspended student ${student.name} (${student.id}) due to overdue fees.`,
                        branchId: student.branchId
                    }
                }),
                // Log Audit Log - WhatsApp broadcast removal
                db_js_1.prisma.auditLog.create({
                    data: {
                        actor: 'CRON_ENGINE',
                        role: 'OWNER',
                        action: 'WHATSAPP_REMOVED',
                        details: `Student ${student.id} removed from WhatsApp broadcasts.`,
                        branchId: student.branchId
                    }
                })
            ]);
            // Dispatch WhatsApp suspension message
            const suspensionMsg = `🚨 Suspension Alert for ${student.name} (${student.id}): Dojo access and portals are suspended due to tuition fees being overdue by ${Math.abs(diffDays)} days. A reactivation charge of ₹${chargeAmount} has been applied. Reactivation requires clearing all outstanding balance.`;
            await (0, whatsapp_js_1.sendWhatsAppMessage)(student.mobile, suspensionMsg, student.branchId);
        }
        // Case 2: Friendly Reminder (5 days before due date, diffDays === 5)
        else if (diffDays === 5) {
            friendlyReminders++;
            await db_js_1.prisma.$transaction([
                db_js_1.prisma.timelineEvent.create({
                    data: {
                        studentId: student.id,
                        type: 'FRIENDLY_REMINDER_SENT',
                        description: 'Friendly fee payment reminder sent.'
                    }
                }),
                db_js_1.prisma.auditLog.create({
                    data: {
                        actor: 'CRON_ENGINE',
                        role: 'OWNER',
                        action: 'FRIENDLY_REMINDER_SENT',
                        details: `Friendly WhatsApp alert dispatched to ${student.id}.`,
                        branchId: student.branchId
                    }
                })
            ]);
            const reminderMsg = `💬 Friendly Reminder: Monthly tuition fee of ₹3600 for ${student.name} (${student.id}) is due in 5 days on ${student.feeDueDate.toISOString().split('T')[0]}. Please pay to ensure uninterrupted Dojo access.`;
            await (0, whatsapp_js_1.sendWhatsAppMessage)(student.mobile, reminderMsg, student.branchId);
        }
        // Case 3: Overdue Warning (5 days after due date, diffDays === -5)
        else if (diffDays === -5) {
            overdueReminders++;
            await db_js_1.prisma.$transaction([
                db_js_1.prisma.timelineEvent.create({
                    data: {
                        studentId: student.id,
                        type: 'OVERDUE_REMINDER_SENT',
                        description: 'Overdue fee payment reminder sent.'
                    }
                }),
                db_js_1.prisma.auditLog.create({
                    data: {
                        actor: 'CRON_ENGINE',
                        role: 'OWNER',
                        action: 'OVERDUE_REMINDER_SENT',
                        details: `Overdue WhatsApp alert warning dispatched to ${student.id}.`,
                        branchId: student.branchId
                    }
                })
            ]);
            const warningMsg = `⚠️ Overdue warning: Monthly tuition fee of ₹3600 for ${student.name} (${student.id}) is overdue by 5 days. Please clear it immediately to avoid suspension.`;
            await (0, whatsapp_js_1.sendWhatsAppMessage)(student.mobile, warningMsg, student.branchId);
        }
    }
    console.log(`[Financial Discipline Cron] Finished. Suspensions: ${suspensions}, Friendly: ${friendlyReminders}, Overdue: ${overdueReminders}`);
    return { suspensions, friendlyReminders, overdueReminders };
}
// Schedule cron to run every night at 00:01
function startCronScheduler() {
    node_cron_1.default.schedule('1 0 * * *', async () => {
        try {
            await runFinancialCron();
        }
        catch (error) {
            console.error('[Financial Cron Error] Execution failed:', error);
        }
    });
    console.log('[Cron Service] Scheduled nightly check at 00:01.');
}
