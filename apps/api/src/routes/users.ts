import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { Prisma, Role } from '@zenshin/db';

const router = Router();

type ManagedRole = Exclude<Role, 'OWNER'>;

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  branch?: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
    branch: user.branch?.name ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function getCreatableRoles(actorRole: Role): Role[] {
  if (actorRole === 'OWNER') {
    return ['OWNER', 'MANAGER', 'INSTRUCTOR', 'PARENT', 'STUDENT'];
  }

  return ['INSTRUCTOR', 'PARENT', 'STUDENT'];
}

async function resolveActorBranchName(branchId: string | null) {
  if (!branchId) {
    return null;
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  return branch?.name ?? null;
}

async function resolveBranchIdForPayload(
  actor: NonNullable<AuthenticatedRequest['user']>,
  role: Role,
  branchName?: string | null
) {
  if (role === 'OWNER') {
    return null;
  }

  if (actor.role === 'MANAGER') {
    if (!actor.branchId) {
      throw new Error('Managers must be assigned to a branch before managing users.');
    }

    return actor.branchId;
  }

  if (!branchName) {
    throw new Error('Branch name is required for non-owner users.');
  }

  const branch = await prisma.branch.findUnique({ where: { name: branchName } });
  if (!branch) {
    throw new Error('Invalid branch name specified.');
  }

  return branch.id;
}

async function assertManagerCanManageTarget(
  actor: NonNullable<AuthenticatedRequest['user']>,
  target: { id: string; role: Role; branchId: string | null }
) {
  if (actor.role !== 'MANAGER') {
    return;
  }

  if (!actor.branchId) {
    throw new Error('Manager branch access is not configured.');
  }

  if (target.role === 'OWNER' || target.role === 'MANAGER') {
    throw new Error('Managers can only manage instructor, parent, or student accounts.');
  }

  if (target.branchId !== actor.branchId) {
    throw new Error('Cross-branch user management is not allowed.');
  }
}

router.get('/', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    const users = await prisma.user.findMany({
      where:
        user.role === 'OWNER'
          ? undefined
          : {
              branchId: user.branchId,
              role: { not: 'OWNER' }
            },
      include: { branch: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
    });

    res.json(users.map(sanitizeUser));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users', details: error.message });
  }
});

router.post('/', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { email, name, password, role, branchName } = req.body as {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
    branchName?: string;
  };

  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'Email, name, password, and role are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  if (!getCreatableRoles(actor.role).includes(role)) {
    return res.status(403).json({ error: 'You are not allowed to create this role.' });
  }

  try {
    const branchId = await resolveBranchIdForPayload(actor, role, branchName);
    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password: hashedPassword,
          role,
          branchId
        },
        include: { branch: true }
      });

      await tx.auditLog.create({
        data: {
          actor: actor.email,
          role: actor.role,
          action: 'USER_CREATE',
          details: `Created ${role} account for ${newUser.email}.`,
          branchId: branchId ?? actor.branchId
        }
      });

      return newUser;
    });

    res.status(201).json(sanitizeUser(created));
  } catch (error: any) {
    const status = error.code === 'P2002' ? 409 : 400;
    res.status(status).json({ error: error.code === 'P2002' ? 'A user with this email already exists.' : error.message || 'Failed to create user' });
  }
});

router.put('/:id', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { id } = req.params;
  const { email, name, role, branchName } = req.body as {
    email?: string;
    name?: string;
    role?: Role;
    branchName?: string | null;
  };

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { branch: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await assertManagerCanManageTarget(actor, existing);

    if (actor.id === existing.id && role && role !== existing.role) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const nextRole = role ?? existing.role;
    if (!getCreatableRoles(actor.role).includes(nextRole) && !(actor.role === 'OWNER' && nextRole === 'OWNER')) {
      return res.status(403).json({ error: 'You are not allowed to assign this role.' });
    }

    const branchId = await resolveBranchIdForPayload(actor, nextRole, branchName ?? existing.branch?.name ?? null);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const nextUser = await tx.user.update({
        where: { id },
        data: {
          email: email ? email.trim().toLowerCase() : undefined,
          name: name ? name.trim() : undefined,
          role: nextRole,
          branchId
        },
        include: { branch: true }
      });

      await tx.auditLog.create({
        data: {
          actor: actor.email,
          role: actor.role,
          action: 'USER_UPDATE',
          details: `Updated account for ${nextUser.email}.`,
          branchId: branchId ?? existing.branchId ?? actor.branchId
        }
      });

      return nextUser;
    });

    res.json(sanitizeUser(updated));
  } catch (error: any) {
    const status = error.code === 'P2002' ? 409 : error.message === 'User not found.' ? 404 : 400;
    res.status(status).json({ error: error.code === 'P2002' ? 'A user with this email already exists.' : error.message || 'Failed to update user' });
  }
});

router.post('/:id/reset-password', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { id } = req.params;
  const { password } = req.body as { password?: string };

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await assertManagerCanManageTarget(actor, existing);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      await tx.auditLog.create({
        data: {
          actor: actor.email,
          role: actor.role,
          action: 'USER_PASSWORD_RESET',
          details: `Reset password for ${existing.email}.`,
          branchId: existing.branchId ?? actor.branchId
        }
      });
    });

    res.json({ message: 'Password reset successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reset password' });
  }
});

router.delete('/:id', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const { id } = req.params;

  if (actor.id === id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await assertManagerCanManageTarget(actor, existing);

    if (existing.role === 'OWNER') {
      const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'The last owner account cannot be deleted.' });
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actor: actor.email,
          role: actor.role,
          action: 'USER_DELETE',
          details: `Deleted account for ${existing.email}.`,
          branchId: existing.branchId ?? actor.branchId
        }
      });
    });

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete user' });
  }
});

router.get('/meta/branches', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = req.user!;
    if (actor.role === 'MANAGER') {
      const branchName = await resolveActorBranchName(actor.branchId);
      return res.json(branchName ? [branchName] : []);
    }

    const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
    res.json(branches.map((branch) => branch.name));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load branch metadata', details: error.message });
  }
});

router.get('/meta/roles', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const actor = req.user!;
  const roles = getCreatableRoles(actor.role).filter((role): role is ManagedRole | 'OWNER' => role !== 'OWNER' || actor.role === 'OWNER');
  res.json(roles);
});

export default router;