import { NextRequest } from 'next/server';
import { verifyJWT } from './jwt';

export function getUserFromRequest(request: NextRequest): Record<string, unknown> | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyJWT(token);
}

export function requireOwner(request: NextRequest): Record<string, unknown> | null {
  const user = getUserFromRequest(request);
  if (!user) return null;
  if (user.role !== 'owner') return null;
  return user;
}

export function requireAuth(request: NextRequest): Record<string, unknown> | null {
  const user = getUserFromRequest(request);
  if (!user) return null;
  return user;
}
