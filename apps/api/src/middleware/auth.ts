import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@zenshin/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    branchId: string | null;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const secret = process.env.JWT_SECRET || 'zenshin_secret_key_12345';
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User context not found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of the following roles: ${allowedRoles.join(', ')}` });
    }

    next();
  };
}

export function requireBranchAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'User context not found' });
  }

  // Owner has global access
  if (req.user.role === 'OWNER') {
    return next();
  }

  // Instructors and Managers must have a branch
  const userBranchId = req.user.branchId;
  if (!userBranchId) {
    return res.status(403).json({ error: 'Forbidden: user has no assigned branch' });
  }

  // Extract branchId from query parameters, body, or route parameters
  const requestBranchId = req.query.branchId || req.body.branchId || req.params.branchId;

  if (requestBranchId && requestBranchId !== userBranchId) {
    return res.status(403).json({ error: 'Forbidden: cross-branch access denied' });
  }

  next();
}
