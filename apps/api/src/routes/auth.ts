import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'zenshin_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'zenshin_refresh_secret_key_12345';

// Initialize branches and default admin user if they don't exist
export async function seedInitialDatabase() {
  try {
    // 1. Seed branches
    const sirifort = await prisma.branch.upsert({
      where: { name: 'Sirifort' },
      update: {},
      create: { name: 'Sirifort' }
    });

    const asiad = await prisma.branch.upsert({
      where: { name: 'Asiad' },
      update: {},
      create: { name: 'Asiad' }
    });

    // 2. Seed owner
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'OWNER' }
    });

    if (!existingOwner) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'owner@zenshin.com',
          name: 'Shihan Vishal jaiswal',
          password: hashedPassword,
          role: 'OWNER',
          branchId: null
        }
      });
      console.log('[Seeding] Created default owner: owner@zenshin.com / password123');
    }

    // 3. Seed manager for Sirifort
    const existingManager = await prisma.user.findFirst({
      where: { role: 'MANAGER', branchId: sirifort.id }
    });

    if (!existingManager) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
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
    const existingSettings = await prisma.settings.findUnique({
      where: { id: 'global' }
    });

    if (!existingSettings) {
      await prisma.settings.create({
        data: { id: 'global', maxGracePeriod: 10, reactivationCharge: 1000 }
      });
      console.log('[Seeding] Seeded default global parameters');
    }

  } catch (error) {
    console.error('[Seeding Error] Failed database seed:', error);
  }
}

// POST /api/auth/login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
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

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Log login audit event
    await prisma.auditLog.create({
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

  } catch (error: any) {
    res.status(500).json({ error: 'Login execution failed', details: error.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const payload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      branchId: decoded.branchId
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  });
});

export default router;
