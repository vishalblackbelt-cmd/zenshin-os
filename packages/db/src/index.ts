import { PrismaClient } from '@prisma/client';
export * from '@prisma/client'; // This exports Role, AttendanceStatus, etc.

const prisma = new PrismaClient();
export default prisma;