import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, requireRole, requireBranchAccess } from '../middleware/auth.js';
import { StudentStatus, LedgerEntryType } from '@zenshin/db';
import { Prisma } from '@zenshin/db';

const router = Router();

// GET /api/students
router.get('/', requireRole(['OWNER', 'MANAGER', 'INSTRUCTOR', 'PARENT', 'STUDENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let branchFilter: string | undefined = req.query.branch as string;

    // RBAC: If manager or instructor, lock to their branch
    if ((user.role === 'MANAGER' || user.role === 'INSTRUCTOR') && user.branchId) {
      const userBranch = await prisma.branch.findUnique({ where: { id: user.branchId } });
      branchFilter = userBranch?.name;
    }

    const whereClause: any = {};
    if (branchFilter) {
      whereClause.branch = { name: branchFilter };
    }

    const list = await prisma.student.findMany({
      where: whereClause,
      include: { branch: true },
      orderBy: { id: 'asc' }
    });

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve students', details: error.message });
  }
});

// GET /api/students/:id
router.get('/:id', requireRole(['OWNER', 'MANAGER', 'INSTRUCTOR', 'PARENT', 'STUDENT']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        branch: true,
        attendances: { orderBy: { date: 'desc' } },
        ledgerEntries: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { date: 'desc' } }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve student', details: error.message });
  }
});

// POST /api/students
router.post('/', requireRole(['OWNER', 'MANAGER']), requireBranchAccess, async (req: AuthenticatedRequest, res: Response) => {
  const { name, age, category, parentName, mobile, branchName, currentBelt, feeDueDate } = req.body;

  if (!name || !age || !category || !parentName || !mobile || !branchName || !currentBelt || !feeDueDate) {
    return res.status(400).json({ error: 'Missing required student enrollment parameters' });
  }

  try {
    const branch = await prisma.branch.findUnique({ where: { name: branchName } });
    if (!branch) {
      return res.status(400).json({ error: 'Invalid branch name specified' });
    }

    if (req.user!.role === 'MANAGER' && req.user!.branchId && req.user!.branchId !== branch.id) {
      return res.status(403).json({ error: 'Managers can only enroll students in their own branch' });
    }

    // Generate student ID sequentially
    const prefix = branch.name === 'Sirifort' ? 'ZD' : 'AD';
    const count = await prisma.student.count({ where: { branchId: branch.id } });
    const studentId = `${prefix}${String(count + 1).padStart(4, '0')}`;

    // Create student and record initial charge (tuition fee of ₹3600)
    const newStudent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const student = await tx.student.create({
        data: {
          id: studentId,
          name,
          age: parseInt(age),
          category,
          parentName,
          mobile,
          branchId: branch.id,
          currentBelt,
          status: 'ACTIVE',
          feeDueDate: new Date(feeDueDate),
          outstandingBalance: 3600, // Monthly fee charge
          examEligible: true
        }
      });

      // Create first monthly ledger charge
      await tx.ledgerEntry.create({
        data: {
          studentId: studentId,
          type: LedgerEntryType.CHARGE,
          amount: 3600,
          description: 'First Month Membership Tuition Fee'
        }
      });

      // Log timeline event
      await tx.timelineEvent.create({
        data: {
          studentId: studentId,
          type: 'STUDENT_JOINED',
          description: 'Student enrolled and membership started.'
        }
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'STUDENT_ADD',
          details: `Enrolled new student ${name} with ID ${studentId}.`,
          branchId: branch.id
        }
      });

      return student;
    });

    res.status(201).json(newStudent);

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to enroll student', details: error.message });
  }
});

// PUT /api/students/:id
router.put('/:id', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, age, category, parentName, mobile, currentBelt, feeDueDate, examEligible } = req.body;

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const studentUpdated = await tx.student.update({
        where: { id },
        data: {
          name,
          age: age ? parseInt(age) : undefined,
          category,
          parentName,
          mobile,
          currentBelt,
          feeDueDate: feeDueDate ? new Date(feeDueDate) : undefined,
          examEligible: examEligible !== undefined ? examEligible === true : undefined
        }
      });

      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'STUDENT_EDIT',
          details: `Modified details for student ${id}.`,
          branchId: student.branchId
        }
      });

      return studentUpdated;
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update student', details: error.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.student.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'STUDENT_DELETE',
          details: `Deleted student record ${id}.`,
          branchId: student.branchId
        }
      });
    });

    res.json({ message: `Student ${id} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete student', details: error.message });
  }
});

// POST /api/students/:id/suspend
router.post('/:id/suspend', requireRole(['OWNER', 'MANAGER']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.status === 'INACTIVE') {
      return res.status(400).json({ error: 'Student is already suspended/inactive' });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    const chargeAmount = settings ? settings.reactivationCharge : 1000;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Mark status as INACTIVE
      const studentUpdated = await tx.student.update({
        where: { id },
        data: {
          status: StudentStatus.INACTIVE,
          outstandingBalance: { increment: chargeAmount }
        }
      });

      // 2. Add Reactivation fee charge to ledger
      await tx.ledgerEntry.create({
        data: {
          studentId: id,
          type: LedgerEntryType.CHARGE,
          amount: chargeAmount,
          description: 'Reactivation Fee (Manual Administrative Suspension)'
        }
      });

      // 3. Log Timeline Event
      await tx.timelineEvent.create({
        data: {
          studentId: id,
          type: 'STUDENT_SUSPENDED',
          description: `Suspended manually by administrator. Reactivation fee of ₹${chargeAmount} charged.`
        }
      });

      // 4. Log Audit Log - Suspension
      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'STUDENT_SUSPENDED',
          details: `Manually suspended student ${student.name} (${id}).`,
          branchId: student.branchId
        }
      });

      // 5. Log Audit Log - WhatsApp broadcast removal
      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'WHATSAPP_REMOVED',
          details: `Student ${id} removed from WhatsApp broadcast list.`,
          branchId: student.branchId
        }
      });

      return studentUpdated;
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Manual suspension failed', details: error.message });
  }
});

// GET /api/students/:id/timeline
router.get('/:id/timeline', requireRole(['OWNER', 'MANAGER', 'INSTRUCTOR', 'PARENT', 'STUDENT']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const timeline = await prisma.timelineEvent.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' }
    });
    res.json(timeline);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve timeline', details: error.message });
  }
});

export default router;
