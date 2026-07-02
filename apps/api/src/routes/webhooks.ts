import { Router, Response, Request } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';
import { TrialStatus, StudentStatus, LedgerEntryType } from '@zenshin/db';

const router = Router();

/**
 * Webhook Secret - store this in .env as GOOGLE_SHEETS_WEBHOOK_SECRET
 * Used to validate incoming webhook payloads from Google Sheets Apps Script
 */
const WEBHOOK_SECRET = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || 'dev-secret-key';

/**
 * Verify webhook signature to ensure request originates from trusted Google Sheets script
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const hash = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error);
    return false;
  }
}

/**
 * POST /webhooks/google-sheets/trial-leads
 * Webhook endpoint for syncing trial leads from Google Sheets form
 * 
 * Expected payload:
 * {
 *   "name": "John Doe",
 *   "mobile": "9876543210",
 *   "branch": "Sirifort" | "Asiad",
 *   "paymentStatus": "yes" | "no",
 *   "formTimestamp": "2026-07-02T10:30:00Z"
 * }
 */
router.post('/google-sheets/trial-leads', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }

    const { name, mobile, branch: branchName, paymentStatus, formTimestamp } = req.body;

    // Validate required fields
    if (!name || !mobile || !branchName) {
      return res.status(400).json({
        error: 'Missing required fields: name, mobile, branch',
        received: req.body
      });
    }

    // Validate branch exists
    const branch = await prisma.branch.findUnique({ where: { name: branchName } });
    if (!branch) {
      return res.status(400).json({
        error: `Invalid branch: ${branchName}. Valid branches: Sirifort, Asiad`
      });
    }

    // Check for duplicate entry (same mobile, same branch within last 24 hours)
    const existingLead = await prisma.trialLead.findFirst({
      where: {
        mobile,
        branchId: branch.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (existingLead) {
      return res.status(409).json({
        error: 'Duplicate trial lead detected',
        message: `Trial lead ${name} (${mobile}) already exists for ${branchName}`,
        existingId: existingLead.id
      });
    }

    // Create trial lead via transaction
    const lead = await prisma.$transaction(async (tx) => {
      // Determine trial status based on payment
      const status = paymentStatus === 'yes' ? TrialStatus.PAID : TrialStatus.NEW;
      const paidAmount = paymentStatus === 'yes' ? 500 : 0;

      // Create trial lead
      const created = await tx.trialLead.create({
        data: {
          name,
          mobile,
          branchId: branch.id,
          status,
          paidAmount
        }
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          actor: 'SYSTEM_GOOGLE_SHEETS',
          role: 'OWNER',
          action: 'TRIAL_SYNCED_FROM_FORM',
          details: `Trial lead synced from Google Sheets form: ${name} (${mobile}), Payment: ${paymentStatus}`,
          branchId: branch.id
        }
      });

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Trial lead synced successfully',
      trialId: lead.id,
      branch: branchName,
      name: lead.name,
      status: lead.status,
      syncedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Google Sheets Webhook] Trial lead sync failed:', error);
    res.status(500).json({
      error: 'Failed to sync trial lead from Google Sheets',
      details: error.message
    });
  }
});

/**
 * POST /webhooks/google-sheets/students
 * Webhook endpoint for syncing student enrollments from Google Sheets form
 * Automatically creates trial → student conversion
 * 
 * Expected payload:
 * {
 *   "name": "John Doe",
 *   "age": 12,
 *   "category": "Kids",
 *   "parentName": "Jane Doe",
 *   "mobile": "9876543210",
 *   "branch": "Sirifort" | "Asiad",
 *   "currentBelt": "White",
 *   "feeDueDate": "2026-08-02",
 *   "formTimestamp": "2026-07-02T10:30:00Z"
 * }
 */
router.post('/google-sheets/students', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }

    const {
      name,
      age,
      category,
      parentName,
      mobile,
      branch: branchName,
      currentBelt,
      feeDueDate,
      formTimestamp
    } = req.body;

    // Validate required fields
    if (!name || !age || !category || !parentName || !mobile || !branchName || !currentBelt || !feeDueDate) {
      return res.status(400).json({
        error: 'Missing required student enrollment fields',
        required: ['name', 'age', 'category', 'parentName', 'mobile', 'branch', 'currentBelt', 'feeDueDate'],
        received: req.body
      });
    }

    // Validate branch
    const branch = await prisma.branch.findUnique({ where: { name: branchName } });
    if (!branch) {
      return res.status(400).json({
        error: `Invalid branch: ${branchName}. Valid branches: Sirifort, Asiad`
      });
    }

    // Check if student already enrolled (duplicate mobile in branch)
    const existingStudent = await prisma.student.findFirst({
      where: {
        mobile,
        branchId: branch.id
      }
    });

    if (existingStudent) {
      return res.status(409).json({
        error: 'Student already enrolled',
        message: `Student with mobile ${mobile} already exists in ${branchName}`,
        studentId: existingStudent.id
      });
    }

    // Create student with enrollment
    const student = await prisma.$transaction(async (tx) => {
      // Generate unique student ID
      const prefix = branch.name === 'Sirifort' ? 'ZD' : 'AD';
      const count = await tx.student.count({ where: { branchId: branch.id } });
      const studentId = `${prefix}${String(count + 1).padStart(4, '0')}`;

      // Create student record
      const newStudent = await tx.student.create({
        data: {
          id: studentId,
          name,
          age: parseInt(age),
          category,
          parentName,
          mobile,
          branchId: branch.id,
          currentBelt,
          status: StudentStatus.ACTIVE,
          feeDueDate: new Date(feeDueDate),
          outstandingBalance: 3600, // Monthly tuition fee
          examEligible: true
        }
      });

      // Create initial ledger charge
      await tx.ledgerEntry.create({
        data: {
          studentId: newStudent.id,
          type: LedgerEntryType.CHARGE,
          amount: 3600,
          description: 'First Month Membership Tuition Fee (Synced from Google Sheets)'
        }
      });

      // Create timeline event
      await tx.timelineEvent.create({
        data: {
          studentId: newStudent.id,
          type: 'STUDENT_JOINED',
          description: 'Student enrolled via Google Sheets form submission.'
        }
      });

      // Log audit trail
      await tx.auditLog.create({
        data: {
          actor: 'SYSTEM_GOOGLE_SHEETS',
          role: 'OWNER',
          action: 'STUDENT_SYNCED_FROM_FORM',
          details: `Student enrolled via Google Sheets form: ${name} (${studentId}), Mobile: ${mobile}`,
          branchId: branch.id
        }
      });

      return newStudent;
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully via Google Sheets',
      studentId: student.id,
      branch: branchName,
      name: student.name,
      category: student.category,
      currentBelt: student.currentBelt,
      status: student.status,
      enrolledAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Google Sheets Webhook] Student enrollment sync failed:', error);
    res.status(500).json({
      error: 'Failed to sync student enrollment from Google Sheets',
      details: error.message
    });
  }
});

/**
 * POST /webhooks/google-sheets/attendance
 * Webhook endpoint for syncing attendance records from Google Sheets form
 * 
 * Expected payload:
 * {
 *   "studentId": "ZD0001",
 *   "date": "2026-07-02",
 *   "status": "PRESENT" | "ABSENT" | "LATE",
 *   "batch": "Kids (5:00 PM)",
 *   "formTimestamp": "2026-07-02T10:30:00Z"
 * }
 */
router.post('/google-sheets/attendance', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }

    const { studentId, date, status, batch, formTimestamp } = req.body;

    // Validate required fields
    if (!studentId || !date || !status || !batch) {
      return res.status(400).json({
        error: 'Missing required attendance fields: studentId, date, status, batch',
        received: req.body
      });
    }

    // Validate attendance status
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid attendance status: ${status}. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({
        error: `Student not found: ${studentId}`
      });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        date: new Date(date),
        status: status as any,
        batch
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actor: 'SYSTEM_GOOGLE_SHEETS',
        role: 'OWNER',
        action: 'ATTENDANCE_SYNCED_FROM_FORM',
        details: `Attendance recorded for student ${studentId}: ${status} on ${date}`,
        branchId: student.branchId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Attendance record synced successfully',
      attendanceId: attendance.id,
      studentId: student.id,
      date: attendance.date,
      status: attendance.status,
      batch: attendance.batch,
      syncedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Google Sheets Webhook] Attendance sync failed:', error);
    res.status(500).json({
      error: 'Failed to sync attendance from Google Sheets',
      details: error.message
    });
  }
});

/**
 * GET /webhooks/google-sheets/health
 * Health check endpoint for webhook configuration validation
 * Returns webhook status and sync statistics
 */
router.get('/google-sheets/health', async (req: Request, res: Response) => {
  try {
    const trialsCount = await prisma.trialLead.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const studentsCount = await prisma.student.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const attendanceCount = await prisma.attendance.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      status: 'HEALTHY',
      message: 'Google Sheets webhook service is operational',
      webhookActive: true,
      stats: {
        trialsLastWeek: trialsCount,
        studentsLastWeek: studentsCount,
        attendanceLastWeek: attendanceCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      error: 'Webhook health check failed',
      details: error.message
    });
  }
});

export default router;
