import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, requireRole, requireBranchAccess } from '../middleware/auth.js';
import { TrialStatus } from '@zenshin/db';

const router = Router();

// GET /api/trials
router.get('/', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let branchFilter = req.query.branch as string;

  try {
    if (user.role === 'MANAGER' && user.branchId) {
      const userBranch = await prisma.branch.findUnique({ where: { id: user.branchId } });
      branchFilter = userBranch?.name || '';
    }

    const whereClause: any = {};
    if (branchFilter) {
      whereClause.branch = { name: branchFilter };
    }

    const leads = await prisma.trialLead.findMany({
      where: whereClause,
      include: { branch: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve trial leads', details: error.message });
  }
});

// POST /api/trials
router.post('/', requireRole(['OWNER', 'MANAGER']), requireBranchAccess, async (req: AuthenticatedRequest, res: Response) => {
  const { name, mobile, branchName, payMandatory } = req.body; // payMandatory: 'yes' | 'no'

  if (!name || !mobile || !branchName) {
    return res.status(400).json({ error: 'Missing required trial lead details' });
  }

  try {
    const branch = await prisma.branch.findUnique({ where: { name: branchName } });
    if (!branch) {
      return res.status(400).json({ error: 'Invalid branch name specified' });
    }

    const status = payMandatory === 'yes' ? TrialStatus.PAID : TrialStatus.NEW;
    const paidAmount = payMandatory === 'yes' ? 500 : 0;

    const lead = await prisma.$transaction(async (tx) => {
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
          actor: req.user!.email,
          role: req.user!.role,
          action: 'TRIAL_ADD',
          details: `Registered trial lead ${name} (${status}) for branch ${branchName}.`,
          branchId: branch.id
        }
      });

      return created;
    });

    res.status(201).json(lead);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create trial lead', details: error.message });
  }
});

// PUT /api/trials/:id/status
router.put('/:id/status', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // TrialStatus

  if (!status) {
    return res.status(400).json({ error: 'Target status parameter is required' });
  }

  try {
    const lead = await prisma.trialLead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Trial lead not found' });
    }

    // Enforce billing: Can convert to JOINED only if payment status is PAID (i.e. lead.paidAmount >= 500)
    if (status === 'JOINED' && lead.paidAmount < 500 && lead.status !== 'PAID') {
      return res.status(400).json({ error: 'Lead cannot convert to JOINED. The ₹500 mandatory trial fee must be PAID first!' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let paidAmount = lead.paidAmount;
      if (status === 'PAID') {
        paidAmount = 500;
      }

      const leadUpdated = await tx.trialLead.update({
        where: { id },
        data: {
          status: status as TrialStatus,
          paidAmount
        }
      });

      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'TRIAL_UPDATE',
          details: `Updated trial lead ${lead.name} status to ${status}.`,
          branchId: lead.branchId
        }
      });

      return leadUpdated;
    });

    res.json(updated);

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update trial lead status', details: error.message });
  }
});

export default router;
