import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { getOptionalEnv, getRequiredEnv } from '../config.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

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

    const seedPassword = getOptionalEnv('DEFAULT_SEED_PASSWORD');

    if (seedPassword) {
      const hashedPassword = await bcrypt.hash(seedPassword, 10);
      const defaultUsers = [
        {
          email: 'owner@zenshin.com',
          name: 'Shihan Vishal Jaiswal',
          role: 'OWNER' as const,
          branchId: null,
          label: 'default owner'
        },
        {
          email: 'sirifort@zenshin.com',
          name: 'Anjali Sen',
          role: 'MANAGER' as const,
          branchId: sirifort.id,
          label: 'default Sirifort manager'
        },
        {
          email: 'asiad@zenshin.com',
          name: 'Rahul Kapoor',
          role: 'MANAGER' as const,
          branchId: asiad.id,
          label: 'default Asiad manager'
        },
        {
          email: 'instructor@zenshin.com',
          name: 'Meera Bhatia',
          role: 'INSTRUCTOR' as const,
          branchId: sirifort.id,
          label: 'default instructor'
        }
      ];

      for (const defaultUser of defaultUsers) {
        const existingUser = await prisma.user.findUnique({
          where: { email: defaultUser.email }
        });

        if (existingUser) {
          continue;
        }

        await prisma.user.create({
          data: {
            email: defaultUser.email,
            name: defaultUser.name,
            password: hashedPassword,
            role: defaultUser.role,
            branchId: defaultUser.branchId
          }
        });
        console.log(`[Seeding] Created ${defaultUser.label} account.`);
      }
    } else {
      console.warn('[Seeding] DEFAULT_SEED_PASSWORD is not configured. Skipping default user creation.');
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
    const jwtSecret = getRequiredEnv('JWT_SECRET');
    const jwtRefreshSecret = getRequiredEnv('JWT_REFRESH_SECRET');

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

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' });

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

  let jwtSecret: string;
  let jwtRefreshSecret: string;

  try {
    jwtSecret = getRequiredEnv('JWT_SECRET');
    jwtRefreshSecret = getRequiredEnv('JWT_REFRESH_SECRET');
  } catch {
    return res.status(500).json({ error: 'Server authentication is not configured' });
  }

  jwt.verify(refreshToken, jwtRefreshSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const payload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      branchId: decoded.branchId
    };

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    res.json({ accessToken });
  });
});

export default router;
