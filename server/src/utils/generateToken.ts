import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/user.model';

export const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const payload = { id: user._id, email: user.email };
  
  return jwt.sign(
    payload, 
    secret, 
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    } as jwt.SignOptions
  );
}; 