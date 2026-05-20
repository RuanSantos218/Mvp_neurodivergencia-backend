import e from 'express';
import { AuthenticatedRequest } from '../types/express.type';
import { verifyToken } from '../utils/jwt-utils';

export const jwtMiddleware = (req: AuthenticatedRequest, res: e.Response, next: e.NextFunction) => {
  const authHeader = req.headers.authorization; 
  
    if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }
    const tokenValue = parts[1];

    try {
    const decoded = verifyToken(tokenValue);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}