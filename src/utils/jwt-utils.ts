import e from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
}

export interface JwtRequest extends e.Request {
  user?: JwtPayload;
}

export interface JwtResponse {
  token: string;
}

export interface JwtError {
  message: string;
}
 

export interface JwtConfig {
  secret: string;
  expiresIn: string | number;
}

export interface validateTokenOptions {
  secret: string;
  algorithms?: jwt.Algorithm[];
}


export const JWT_SECRET = process.env.JWT_SECRET as string;


export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const validateToken = (token: string, options: validateTokenOptions): JwtPayload => {
  try {
    return jwt.verify(token, options.secret, { algorithms: options.algorithms }) as JwtPayload; 
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const jwtMiddleware = (req: JwtRequest, res: e.Response, next: e.NextFunction) => {
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
    return res.status(401).json({ message: 'Invalid token' });
  }
};