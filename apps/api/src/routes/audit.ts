import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/audit
router.get('/', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  try {
    const whereClause: any = {};
    if (user.role === 'MANAGER' && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: { branch: true },
      orderBy: { timestamp: 'desc' }
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: error.message });
  }
});

export default router;
