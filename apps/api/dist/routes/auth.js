"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialDatabase = seedInitialDatabase;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../db.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'zenshin_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'zenshin_refresh_secret_key_12345';
// Initialize branches and default admin user if they don't exist
async function seedInitialDatabase() {
    try {
        // 1. Seed branches
        const sirifort = await db_js_1.prisma.branch.upsert({
            where: { name: 'Sirifort' },
            update: {},
            create: { name: 'Sirifort' }
        });
        const asiad = await db_js_1.prisma.branch.upsert({
            where: { name: 'Asiad' },
            update: {},
            create: { name: 'Asiad' }
        });
        // 2. Seed owner
        const existingOwner = await db_js_1.prisma.user.findFirst({
            where: { role: 'OWNER' }
        });
        if (!existingOwner) {
            const hashedPassword = await bcrypt_1.default.hash('password123', 10);
            await db_js_1.prisma.user.create({
                data: {
                    email: 'owner@zenshin.com',
                    name: 'Sensei Vikram Singh',
                    password: hashedPassword,
                    role: 'OWNER',
                    branchId: null
                }
            });
            console.log('[Seeding] Created default owner: owner@zenshin.com / password123');
        }
        // 3. Seed manager for Sirifort
        const existingManager = await db_js_1.prisma.user.findFirst({
            where: { role: 'MANAGER', branchId: sirifort.id }
        });
        if (!existingManager) {
            const hashedPassword = await bcrypt_1.default.hash('password123', 10);
            await db_js_1.prisma.user.create({
                data: {
                    email: 'sirifort@zenshin.com',
                    name: 'Anjali Sen',
                    password: hashedPassword,
                    role: 'MANAGER',
                    branchId: sirifort.id
                }
            });
            console.log('[Seeding] Created Sirifort manager: sirifort@zenshin.com / password123');
        }
        // 4. Seed system settings
        const existingSettings = await db_js_1.prisma.settings.findUnique({
            where: { id: 'global' }
        });
        if (!existingSettings) {
            await db_js_1.prisma.settings.create({
                data: { id: 'global', maxGracePeriod: 10, reactivationCharge: 1000 }
            });
            console.log('[Seeding] Seeded default global parameters');
        }
    }
    catch (error) {
        console.error('[Seeding Error] Failed database seed:', error);
    }
}
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await db_js_1.prisma.user.findUnique({
            where: { email },
            include: { branch: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate tokens
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Log login audit event
        await db_js_1.prisma.auditLog.create({
            data: {
                actor: user.name,
                role: user.role,
                action: 'LOGIN',
                details: `${user.role} logged in successfully.`,
                branchId: user.branchId
            }
        });
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                branch: user.branch ? user.branch.name : null
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Login execution failed', details: error.message });
    }
});
// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }
    jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }
        const payload = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            branchId: decoded.branchId
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    });
});
exports.default = router;
