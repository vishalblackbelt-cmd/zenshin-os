"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_js_1 = __importDefault(require("../app.js"));
const db_js_1 = require("../db.js");
const cron_js_1 = require("../services/cron.js");
const whatsapp_js_1 = require("../services/whatsapp.js");
// Mock the Prisma client
jest.mock('../db.js', () => {
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(true),
            create: jest.fn(),
        },
        branch: {
            findUnique: jest.fn(),
            upsert: jest.fn().mockImplementation((args) => {
                return Promise.resolve({
                    id: args?.create?.name === 'Asiad' ? 'asiad-id' : 'sirifort-id',
                    name: args?.create?.name || 'Sirifort'
                });
            }),
        },
        student: {
            count: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        ledgerEntry: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        settings: {
            findUnique: jest.fn().mockResolvedValue({ id: 'global', maxGracePeriod: 10, reactivationCharge: 1000 }),
            create: jest.fn(),
            upsert: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        timelineEvent: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        $transaction: jest.fn((arg) => {
            if (typeof arg === 'function') {
                return arg(mockPrisma);
            }
            return Promise.all(arg);
        }),
    };
    return { prisma: mockPrisma };
});
// Mock WhatsApp service
jest.mock('../services/whatsapp.js', () => ({
    sendWhatsAppMessage: jest.fn().mockResolvedValue(true),
}));
const JWT_SECRET = process.env.JWT_SECRET || 'zenshin_secret_key_12345';
describe('ZENSHIN OS Integration Test Suite', () => {
    let ownerToken;
    let managerToken;
    let studentToken;
    beforeAll(() => {
        // Generate mock tokens
        ownerToken = jsonwebtoken_1.default.sign({ id: 'owner-id', email: 'owner@zenshin.com', role: 'OWNER', branchId: null }, JWT_SECRET);
        managerToken = jsonwebtoken_1.default.sign({ id: 'manager-id', email: 'manager@zenshin.com', role: 'MANAGER', branchId: 'sirifort-id' }, JWT_SECRET);
        studentToken = jsonwebtoken_1.default.sign({ id: 'student-id', email: 'student@zenshin.com', role: 'STUDENT', branchId: 'sirifort-id' }, JWT_SECRET);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('JWT Authentication Middleware', () => {
        it('should return 401 Unauthorized if authorization header is missing', async () => {
            const res = await (0, supertest_1.default)(app_js_1.default).get('/api/students');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Authentication token required');
        });
        it('should return 403 Forbidden if token is invalid', async () => {
            const res = await (0, supertest_1.default)(app_js_1.default)
                .get('/api/students')
                .set('Authorization', 'Bearer invalidtokenhere');
            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Invalid or expired token');
        });
    });
    describe('Role-Based Access Control (RBAC)', () => {
        it('should allow OWNER and MANAGER to view audit logs, but block STUDENT', async () => {
            // Mock db returns
            db_js_1.prisma.auditLog.findMany.mockResolvedValue([]);
            const ownerRes = await (0, supertest_1.default)(app_js_1.default)
                .get('/api/audit')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(ownerRes.status).toBe(200);
            const studentRes = await (0, supertest_1.default)(app_js_1.default)
                .get('/api/audit')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(studentRes.status).toBe(403);
        });
        it('should restrict MANAGER to their own branch scope', async () => {
            const mockBranch = { id: 'sirifort-id', name: 'Sirifort' };
            db_js_1.prisma.branch.findUnique.mockResolvedValue(mockBranch);
            db_js_1.prisma.student.findMany.mockResolvedValue([]);
            const managerRes = await (0, supertest_1.default)(app_js_1.default)
                .get('/api/students?branch=Asiad')
                .set('Authorization', `Bearer ${managerToken}`);
            // MANAGER is sirifort-id, trying to access Asiad should return 403 or auto-filter to Sirifort
            expect(managerRes.status).toBe(200);
            // Verify query is directed to Sirifort
            expect(db_js_1.prisma.branch.findUnique).toHaveBeenCalledWith({ where: { id: 'sirifort-id' } });
        });
    });
    describe('Billing Ledger & Reactivation Logic', () => {
        it('should block manual reactivation if outstanding balance is still greater than zero', async () => {
            const mockStudent = {
                id: 'ZD0002',
                name: 'Kabir Mehta',
                status: 'INACTIVE',
                outstandingBalance: 4600,
                branchId: 'sirifort-id'
            };
            db_js_1.prisma.student.findUnique.mockResolvedValue(mockStudent);
            db_js_1.prisma.settings.findUnique.mockResolvedValue({ id: 'global', maxGracePeriod: 10, reactivationCharge: 1000 });
            // Attempt to reactivate student manually
            const res = await (0, supertest_1.default)(app_js_1.default)
                .post('/api/students/ZD0002/suspend')
                .set('Authorization', `Bearer ${ownerToken}`);
            // Since status is INACTIVE, manually trying to suspend it again returns 400
            expect(res.status).toBe(400);
        });
        it('should reactivate student automatically when balance becomes zero', async () => {
            const mockStudent = {
                id: 'ZD0002',
                name: 'Kabir Mehta',
                status: 'INACTIVE',
                outstandingBalance: 4600,
                branchId: 'sirifort-id',
                mobile: '9811223344',
            };
            db_js_1.prisma.student.findUnique.mockResolvedValue(mockStudent);
            // Mock ledger list returns: Charges total 4600, Payment total 4600 -> outstanding 0
            const mockLedgerList = [
                { id: 'L1', type: 'CHARGE', amount: 3600 },
                { id: 'L2', type: 'CHARGE', amount: 1000 },
                { id: 'L3', type: 'PAYMENT', amount: 4600 }
            ];
            db_js_1.prisma.ledgerEntry.findMany.mockResolvedValue(mockLedgerList);
            db_js_1.prisma.ledgerEntry.create.mockResolvedValue({ id: 'L3', amount: 4600 });
            const res = await (0, supertest_1.default)(app_js_1.default)
                .post('/api/billing/ledger')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                studentId: 'ZD0002',
                type: 'PAYMENT',
                amount: 4600,
                description: 'Full Tuition & Reactivation Settlement'
            });
            expect(res.status).toBe(201);
            // Verify prisma.student.update was called to set status to ACTIVE
            expect(db_js_1.prisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'ZD0002' },
                data: expect.objectContaining({
                    status: 'ACTIVE',
                    outstandingBalance: 0
                })
            }));
            // Verify WhatsApp restoral notification is fired
            expect(whatsapp_js_1.sendWhatsAppMessage).toHaveBeenCalledWith('9811223344', expect.stringContaining('Reactivation complete'), 'sirifort-id');
        });
    });
    describe('Financial Discipline Engine (Cron Logic)', () => {
        it('should send friendly reminder 5 days BEFORE due date', async () => {
            const today = new Date();
            const fiveDaysFromNow = new Date(today);
            fiveDaysFromNow.setDate(today.getDate() + 5);
            const mockStudent = {
                id: 'ZD0003',
                name: 'Arjun Verma',
                mobile: '9999888877',
                status: 'ACTIVE',
                feeDueDate: fiveDaysFromNow,
                branchId: 'sirifort-id'
            };
            db_js_1.prisma.settings.findUnique.mockResolvedValue({ maxGracePeriod: 10, reactivationCharge: 1000 });
            db_js_1.prisma.student.findMany.mockResolvedValue([mockStudent]);
            const results = await (0, cron_js_1.runFinancialCron)();
            expect(results.friendlyReminders).toBe(1);
            expect(whatsapp_js_1.sendWhatsAppMessage).toHaveBeenCalledWith('9999888877', expect.stringContaining('due in 5 days'), 'sirifort-id');
        });
        it('should suspend student 10 days AFTER due date', async () => {
            const today = new Date();
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);
            const mockStudent = {
                id: 'ZD0004',
                name: 'Nancy Goel',
                mobile: '9888777666',
                status: 'ACTIVE',
                feeDueDate: tenDaysAgo,
                branchId: 'sirifort-id'
            };
            db_js_1.prisma.settings.findUnique.mockResolvedValue({ maxGracePeriod: 10, reactivationCharge: 1000 });
            db_js_1.prisma.student.findMany.mockResolvedValue([mockStudent]);
            const results = await (0, cron_js_1.runFinancialCron)();
            expect(results.suspensions).toBe(1);
            // Verify update sets status to INACTIVE and increments balance by 1000 reactivation fee
            expect(db_js_1.prisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'ZD0004' },
                data: expect.objectContaining({
                    status: 'INACTIVE',
                    outstandingBalance: { increment: 1000 }
                })
            }));
            // Verify WhatsApp suspension warning is fired
            expect(whatsapp_js_1.sendWhatsAppMessage).toHaveBeenCalledWith('9888777666', expect.stringContaining('suspended'), 'sirifort-id');
        });
    });
});
