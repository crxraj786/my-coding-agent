---
Task ID: 3
Agent: Backend API Agent
Task: Build all backend API routes for LR Licence Verification System

Files Created:
1. src/lib/jwt.ts — JWT sign/verify utility (HMAC-SHA256, 24h expiry)
2. src/lib/auth.ts — Auth helpers (getUserFromRequest, requireOwner, requireAuth)
3. src/app/api/auth/login/route.ts — POST: owner/admin login with JWT token
4. src/app/api/auth/verify/route.ts — POST: JWT verification
5. src/app/api/admins/route.ts — GET: list admins, POST: create admin
6. src/app/api/admins/[id]/route.ts — PATCH: update admin, DELETE: delete admin with cascade
7. src/app/api/keys/route.ts — GET: list keys with filters/pagination, POST: create key with balance check
8. src/app/api/keys/[id]/route.ts — PATCH: block/unblock key, DELETE: soft-delete key
9. src/app/api/keys/verify/route.ts — POST: public key verification with device tracking
10. src/app/api/dashboard/stats/route.ts — GET: role-based dashboard statistics
11. src/app/api/setup/route.ts — GET: check tables, POST: execute SQL
12. src/app/api/balance/[adminId]/route.ts — GET: balance logs, PATCH: update balance

Status: Completed
- ESLint passes with zero errors
- Dev server compiles successfully
- All 10 API route groups implemented (12 files + 2 lib utilities)
