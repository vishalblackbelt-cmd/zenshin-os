import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, requireRole, requireBranchAccess } from '../middleware/auth.js';
import { AttendanceStatus } from '@zenshin/db';

const router = Router();

// GET /api/attendance
router.get('/', requireRole(['OWNER', 'MANAGER', 'INSTRUCTOR']), async (req: AuthenticatedRequest, res: Response) => {
  const { date, batch, branchName } = req.query;

  try {
    const whereClause: any = {};
    if (date) whereClause.date = new Date(date as string);
    if (batch) whereClause.batch = batch as string;
    if (branchName) whereClause.student = { branch: { name: branchName as string } };

    const logs = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, currentBelt: true } }
      },
      orderBy: { studentId: 'asc' }
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve attendance logs', details: error.message });
  }
});

// POST /api/attendance
router.post('/', requireRole(['OWNER', 'MANAGER', 'INSTRUCTOR']), requireBranchAccess, async (req: AuthenticatedRequest, res: Response) => {
  const { date, batch, records } = req.body; // records: [{ studentId: string, status: AttendanceStatus }]

  if (!date || !batch || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing required attendance logging parameters' });
  }

  try {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const loggedRecords = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const record of records) {
        const student = await tx.student.findUnique({
          where: { id: record.studentId }
        });

        if (!student) {
          throw new Error(`Student ${record.studentId} not found`);
        }

        // Suspended students cannot be marked present/absent
        if (student.status === 'INACTIVE') {
          throw new Error(`Forbidden: Student ${record.studentId} is suspended/inactive. Cannot mark attendance.`);
        }

        // Create or update attendance entry
        const existing = await tx.attendance.findFirst({
          where: {
            studentId: record.studentId,
            date: attendanceDate,
            batch: batch
          }
        });

        let attendanceEntry;
        if (existing) {
          attendanceEntry = await tx.attendance.update({
            where: { id: existing.id },
            data: { status: record.status as AttendanceStatus }
          });
        } else {
          attendanceEntry = await tx.attendance.create({
            data: {
              studentId: record.studentId,
              date: attendanceDate,
              status: record.status as AttendanceStatus,
              batch: batch
            }
          });
        }

        // Recompute student's overall attendance rate
        const totalClasses = await tx.attendance.count({
          where: { studentId: record.studentId }
        });

        const presentClasses = await tx.attendance.count({
          where: {
            studentId: record.studentId,
            status: { in: ['PRESENT', 'LATE'] }
          }
        });

        const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

        await tx.student.update({
          where: { id: record.studentId },
          data: { attendanceRate }
        });

        results.push(attendanceEntry);
      }

      // Log to system audit trail
      await tx.auditLog.create({
        data: {
          actor: req.user!.email,
          role: req.user!.role,
          action: 'ATTENDANCE_MARKED',
          details: `Logged batch attendance for batch "${batch}" on ${date}. Count: ${records.length}`,
          branchId: req.user!.branchId
        }
      });

      return results;
    });

    res.status(201).json(loggedRecords);

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record attendance logs', details: error.message });
  }
});

export default router;
