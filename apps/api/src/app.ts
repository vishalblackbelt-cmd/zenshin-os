import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRouter, { seedInitialDatabase } from './routes/auth.js';
import studentsRouter from './routes/students.js';
import attendanceRouter from './routes/attendance.js';
import trialsRouter from './routes/trials.js';
import billingRouter from './routes/billing.js';
import auditRouter from './routes/audit.js';
import usersRouter from './routes/users.js';
import { getCorsOrigins } from './config.js';
import { runFinancialCron } from './services/cron.js';
import { authenticateToken, requireRole } from './middleware/auth.js';

const app = express();
const corsOrigins = getCorsOrigins();

// Configure Middleware
app.use(
  cors(
    corsOrigins
      ? {
          origin(origin, callback) {
            if (!origin || corsOrigins.includes(origin)) {
              return callback(null, true);
            }

            return callback(new Error('Origin not allowed by CORS'));
          }
        }
      : undefined
  )
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/students', authenticateToken, studentsRouter);
app.use('/api/attendance', authenticateToken, attendanceRouter);
app.use('/api/trials', authenticateToken, trialsRouter);
app.use('/api/billing', authenticateToken, billingRouter);
app.use('/api/audit', authenticateToken, auditRouter);
app.use('/api/users', authenticateToken, usersRouter);

// POST /api/cron/trigger
app.post('/api/cron/trigger', authenticateToken, requireRole(['OWNER', 'MANAGER']), async (req, res) => {
  try {
    const results = await runFinancialCron();
    res.json({ message: 'Financial Discipline Cron Simulation completed', results });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to run financial cron simulation', details: error.message });
  }
});

// Root check endpoint
app.get('/', (req, res) => {
  res.json({ name: 'Zenshin OS API Service', version: '1.3.0-RC1', status: 'HEALTHY' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Bootstrap database
seedInitialDatabase().then(() => {
  console.log('[Bootstrap] Initial database setup verification completed.');
});

export default app;
