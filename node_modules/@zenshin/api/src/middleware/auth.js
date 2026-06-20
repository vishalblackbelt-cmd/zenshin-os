"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
exports.requireBranchAccess = requireBranchAccess;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }
    const secret = process.env.JWT_SECRET || 'zenshin_secret_key_12345';
    jsonwebtoken_1.default.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User context not found' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: requires one of the following roles: ${allowedRoles.join(', ')}` });
        }
        next();
    };
}
function requireBranchAccess(req, res, next) {
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
