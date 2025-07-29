import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables');
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
  });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

/**
 * Extract token from request headers
 */
export const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) return null;
  
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  
  return token || null;
};

/**
 * Generate token pair
 */
export const generateTokenPair = (userPayload: TokenPayload, tokenVersion: number = 0) => {
  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken({
    userId: userPayload.userId,
    tokenVersion,
  });
  
  return { accessToken, refreshToken };
};

/**
 * Decode token without verification (for extracting payload)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
