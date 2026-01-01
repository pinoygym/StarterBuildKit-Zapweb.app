# Security & Code Review Report - InventoryPro
**Date:** 2025-12-09
**Reviewed By:** Claude Code
**Codebase:** InventoryPro v2 (Next.js 15 + Neon PostgreSQL)

---

## Executive Summary

This comprehensive code review analyzed the InventoryPro application across security, performance, and functional dimensions. The review identified **23 issues** ranging from **CRITICAL security vulnerabilities** to medium-priority improvements.

### Severity Breakdown
- **CRITICAL**: 6 issues (immediate action required)
- **HIGH**: 7 issues (address before production)
- **MEDIUM**: 7 issues (plan for remediation)
- **LOW**: 3 issues (best practice improvements)

---

## 🔴 CRITICAL SECURITY ISSUES (Fix Immediately)

### 1. Unprotected Database Wipe Endpoint
**Location:** `app/api/settings/database/clear/route.ts:8`
**Severity:** CRITICAL

**Issue:**
```typescript
export async function POST() {
  try {
    const result = await settingsService.clearDatabase();
    return NextResponse.json({ success: true, data: result });
```

This endpoint has **NO authentication or authorization checks**. Any unauthenticated user can send a POST request to `/api/settings/database/clear` and wipe the entire database.

**Impact:** Complete data loss, catastrophic business disruption

**Recommendation:**
```typescript
import { withAuth } from '@/middleware/auth.middleware';
import { withPermission } from '@/middleware/permission.middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    return withPermission(req, PermissionResource.SETTINGS, PermissionAction.MANAGE, async () => {
      const result = await settingsService.clearDatabase();
      return NextResponse.json({ success: true, data: result });
    });
  });
}
```

**Also apply to:**
- `/api/settings/database/delete-all-transactions/route.ts`
- `/api/settings/database/delete-table/route.ts`
- `/api/settings/database/seed-test/route.ts`

---

### 2. JWT Secret Weak Default & Production Risk
**Location:** `services/auth.service.ts:18`
**Severity:** CRITICAL

**Issue:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key-change-in-production' : '');
```

The code allows an **empty JWT_SECRET in production**, which will cause authentication to fail silently. Additionally, line 318 returns `null` instead of throwing an error when JWT_SECRET is missing.

**Impact:**
- Production authentication failure
- Weak development credentials could leak to production
- Silent failures instead of explicit errors

**Recommendation:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Application cannot start.');
}

// Remove the fallback at line 318 and always throw on missing secret
verifyToken(token: string): JWTPayload | null {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

---

### 3. In-Memory Rate Limiting (Serverless Incompatible)
**Location:** `app/api/auth/login/route.ts:7`
**Severity:** CRITICAL

**Issue:**
```typescript
const buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
```

The rate limiting uses an **in-memory Map** that:
- Resets on server restart
- Doesn't work across multiple serverless instances
- Can be bypassed by sending requests to different instances

**Impact:** Brute-force attacks are not effectively prevented in production

**Recommendation:**
Use Redis or database-backed rate limiting:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60s'),
  analytics: true,
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many attempts' },
      { status: 429 }
    );
  }
  // ... rest of login logic
}
```

---

### 4. User Enumeration via Timing Attack
**Location:** `services/auth.service.ts:82-95, 117-133`
**Severity:** CRITICAL

**Issue:**
The login flow returns different error messages for "user not found" vs "invalid password":
```typescript
if (!user) {
  return { success: false, message: 'Invalid email or password' }; // Line 92-95
}
// ... later
if (!isPasswordValid) {
  return { success: false, message: 'Invalid email or password' }; // Line 129-132
}
```

While the messages are the same, the timing is different due to the missing `bcrypt.compare()` call when the user doesn't exist.

**Impact:** Attackers can enumerate valid email addresses by timing response delays

**Recommendation:**
Always perform the bcrypt comparison even for non-existent users:
```typescript
async login(credentials: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
  const user = await userRepository.findByEmail(credentials.email);

  // Always hash the password to prevent timing attacks
  const dummyHash = '$2a$12$dummyhashfortimingatttackprevention';
  const passwordHash = user?.passwordHash || dummyHash;
  const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);

  if (!user || !isPasswordValid) {
    await auditLogRepository.create({
      userId: user?.id,
      action: AuditAction.USER_LOGIN_FAILED,
      resource: AuditResource.USER,
      details: { email: credentials.email, reason: 'Invalid credentials' },
      ipAddress,
      userAgent,
    });

    return {
      success: false,
      message: 'Invalid email or password',
    };
  }

  // ... rest of login logic
}
```

---

### 5. CSRF Vulnerability via Authorization Header
**Location:** `middleware.ts:32-37`
**Severity:** CRITICAL

**Issue:**
```typescript
const cookieToken = request.cookies.get('auth-token')?.value;
const authHeader = request.headers.get('authorization');
const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

const token = cookieToken || headerToken;
```

The middleware accepts tokens from **both cookies AND Authorization headers**. This defeats CSRF protection for cookie-based authentication.

**Impact:**
- CSRF attacks possible via fetch() with Authorization header
- Cross-origin requests can bypass same-origin cookie restrictions

**Recommendation:**
Only accept tokens from HTTP-only cookies for web requests:
```typescript
// For API-only routes (mobile apps, etc.), use Authorization header
// For web routes, use cookies only
const isApiRoute = pathname.startsWith('/api/external') || pathname.startsWith('/api/mobile');
const token = isApiRoute
  ? (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)
  : request.cookies.get('auth-token')?.value;
```

Or implement CSRF token validation for state-changing operations.

---

### 6. Weak Password Policy
**Location:** `app/api/auth/register/route.ts:19-25`
**Severity:** CRITICAL

**Issue:**
```typescript
if (body.password.length < 8) {
  return NextResponse.json(
    { success: false, message: 'Password must be at least 8 characters long' },
    { status: 400 }
  );
}
```

Only checks password **length**, no complexity requirements.

**Impact:** Users can set weak passwords like "password" or "12345678"

**Recommendation:**
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(body.password)) {
  return NextResponse.json(
    {
      success: false,
      message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
    },
    { status: 400 }
  );
}
```

Or use a password strength library like `zxcvbn`.

---

## 🟠 HIGH PRIORITY ISSUES

### 7. Build Error Suppression
**Location:** `next.config.ts:4-9`
**Severity:** HIGH

**Issue:**
```typescript
eslint: {
  ignoreDuringBuilds: true,
},
typescript: {
  ignoreBuildErrors: true,
},
```

**Impact:** Production builds will succeed even with TypeScript type errors and ESLint violations

**Recommendation:** Remove these flags and fix all type errors before production deployment.

---

### 8. Unrestricted Image Hosting (SSRF Risk)
**Location:** `next.config.ts:17`
**Severity:** HIGH

**Issue:**
```typescript
remotePatterns: [
  {
    protocol: 'https',
    hostname: '**', // TODO: Restrict this to actual image hosts
  },
],
```

**Impact:** Server-Side Request Forgery (SSRF) - attackers can make the server load images from internal services

**Recommendation:**
```typescript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
  },
  {
    protocol: 'https',
    hostname: 'your-cdn.com',
  },
],
```

---

### 9. React Strict Mode Disabled
**Location:** `next.config.ts:11`
**Severity:** HIGH

**Issue:**
```typescript
reactStrictMode: false,
```

**Impact:** Hides potential bugs, side effects, and deprecated API usage

**Recommendation:** Enable strict mode and fix any warnings that appear.

---

### 10. Excessive Console Logging (Data Leakage)
**Location:** Throughout codebase
**Severity:** HIGH

**Issue:** Found **463 instances** of `console.log/console.error` across 100 files

**Examples:**
- `middleware/permission.middleware.ts:135` - Logs user permissions
- `app/api/auth/register/route.ts:50-55` - Logs error stack traces
- `services/settings.service.ts:56` - Logs database operation details

**Impact:**
- Sensitive data in server logs
- PII exposure (emails, names, IDs)
- Stack traces reveal system internals
- Production logs become unmanageable

**Recommendation:**
Create a proper logging service:
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, meta);
    }
    // Send to logging service (DataDog, LogRocket, etc.)
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(message, error);
    // Send to error tracking (Sentry, etc.)
    // NEVER log sensitive fields like passwords, tokens, etc.
  },
};
```

Replace all console.log with the logger and filter sensitive data.

---

### 11. Float for Currency (Precision Loss)
**Location:** `prisma/schema.prisma` (multiple models)
**Severity:** HIGH

**Issue:**
```prisma
model Product {
  basePrice        Float
  averageCostPrice Float
}

model POSSale {
  subtotal     Float
  tax          Float
  totalAmount  Float
}
```

**Impact:** Floating-point rounding errors in financial calculations (e.g., $0.01 discrepancies)

**Recommendation:**
```prisma
model Product {
  basePrice        Decimal @db.Decimal(10, 2)
  averageCostPrice Decimal @db.Decimal(10, 2)
}
```

Migrate existing data carefully.

---

### 12. Missing Indexes for Common Queries
**Location:** `prisma/schema.prisma`
**Severity:** HIGH

**Issue:** Some common query patterns lack indexes:
- No index on `POSSale.paymentMethod + createdAt` for sales reports
- No index on `StockMovement.createdAt + type` for movement reports
- No composite index on `User.email + status` for active user lookups

**Recommendation:**
```prisma
model POSSale {
  @@index([paymentMethod, createdAt])
  @@index([branchId, paymentMethod, createdAt])
}

model StockMovement {
  @@index([createdAt, type])
  @@index([productId, createdAt])
}

model User {
  @@index([email, status])
}
```

---

### 13. No Rate Limiting on Critical Endpoints
**Location:** Most API routes
**Severity:** HIGH

**Issue:** Only `/api/auth/login` has rate limiting. Other critical endpoints are unprotected:
- `/api/products` (POST) - product creation spam
- `/api/pos/sales` (POST) - sales transaction spam
- `/api/users` (POST) - user creation spam

**Recommendation:** Implement global rate limiting middleware or add to critical routes.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 14. Race Condition in POS Inventory Deduction
**Location:** `services/pos.service.ts:185-194`
**Severity:** MEDIUM

**Issue:**
Stock validation happens **outside the transaction**:
```typescript
// Line 189: Inventory check OUTSIDE transaction
const inventoryRecord = product.Inventory.find((inv: any) => inv.warehouseId === data.warehouseId);
const totalAvailableStock = inventoryRecord ? Number(inventoryRecord.quantity) : 0;

if (totalAvailableStock < (currentProductUsage + baseQuantity)) {
  throw new InsufficientStockError(product.name, totalAvailableStock, currentProductUsage + baseQuantity);
}

// ... later, INSIDE transaction (line 250)
return await prisma.$transaction(async (tx) => {
  // Inventory is updated here, but check was above
});
```

**Impact:**
Two concurrent POS sales can both pass the stock check and oversell inventory.

**Example:**
1. Customer A wants 10 units (current stock: 10)
2. Customer B wants 10 units (current stock: 10)
3. Both requests check inventory simultaneously - both see 10 available
4. Both transactions proceed
5. Result: -10 inventory (oversold by 10 units)

**Recommendation:**
Move inventory check inside transaction OR use SELECT FOR UPDATE:
```typescript
return await prisma.$transaction(async (tx) => {
  // Lock inventory row for update
  const currentInventory = await tx.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: item.productId,
        warehouseId: data.warehouseId
      }
    }
  });

  if (!currentInventory || currentInventory.quantity < baseQuantity) {
    throw new InsufficientStockError(product.name, currentInventory?.quantity || 0, baseQuantity);
  }

  // Proceed with deduction
  await tx.inventory.update({
    where: { id: currentInventory.id },
    data: { quantity: { decrement: baseQuantity } }
  });
});
```

---

### 15. No Request Body Size Limits
**Location:** All API routes
**Severity:** MEDIUM

**Issue:** No limit on request body size, allowing DoS attacks via large payloads

**Recommendation:**
Add body size limits in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

---

### 16. Missing CORS Configuration
**Location:** `next.config.ts`
**Severity:** MEDIUM

**Issue:** No CORS headers defined - may cause issues with cross-origin API calls

**Recommendation:**
Add CORS middleware or headers:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (isApiRoute) {
    response.headers.set('Access-Control-Allow-Origin', 'https://your-frontend.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}
```

---

### 17. Inconsistent Case-Sensitive Permission Checks
**Location:** `middleware/permission.middleware.ts:40-42, 99-102`
**Severity:** MEDIUM

**Issue:**
```typescript
// Line 40-42: Case-INSENSITIVE
const hasPermission = permissions.some(
  (p) => p.resource.toLowerCase() === requiredResource.toLowerCase() &&
         p.action.toLowerCase() === requiredAction.toLowerCase()
);

// Line 99-102: Case-SENSITIVE
const hasAnyPermission = requiredPermissions.some((required) =>
  permissions.some(
    (p) => p.resource === required.resource && p.action === required.action
  )
);
```

**Impact:** Inconsistent behavior between `withPermission` and `withAnyPermission`

**Recommendation:** Use consistent case-sensitive checks (Prisma enums are case-sensitive).

---

### 18. No Pagination on List Queries
**Location:** Throughout repository layer
**Severity:** MEDIUM

**Issue:**
All `findMany()` queries lack pagination:
```typescript
async getAll(filters?: InventoryFilters): Promise<InventoryWithRelations[]> {
  const inventory = await prisma.inventory.findMany({ ... });
  return inventory;
}
```

**Impact:** Performance degradation and memory issues as data grows

**Recommendation:**
```typescript
async getAll(
  filters?: InventoryFilters,
  pagination?: { page: number; pageSize: number }
): Promise<PaginatedResult<InventoryWithRelations>> {
  const { page = 1, pageSize = 50 } = pagination || {};

  const [data, total] = await Promise.all([
    prisma.inventory.findMany({
      where: { ... },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventory.count({ where: { ... } }),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

---

### 19. $executeRawUnsafe Usage
**Location:** `services/settings.service.ts:53, 120, 180`
**Severity:** MEDIUM

**Issue:**
```typescript
const result = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
```

While the table names are **hardcoded** (safe in this case), using `$executeRawUnsafe` is a code smell.

**Recommendation:**
Use Prisma's type-safe methods or parameterized queries:
```typescript
// If dynamic table deletion is necessary, validate against whitelist
const ALLOWED_TABLES = ['Product', 'Customer', ...] as const;
type AllowedTable = typeof ALLOWED_TABLES[number];

async function clearTable(tableName: AllowedTable) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error('Invalid table name');
  }
  // Use Prisma delegate
  await prisma[tableName.toLowerCase() as any].deleteMany({});
}
```

---

### 20. No Session Cleanup
**Location:** `services/auth.service.ts`
**Severity:** MEDIUM

**Issue:** No automated cleanup of expired sessions from the database

**Recommendation:**
Add a cron job or background task:
```typescript
// lib/cron/cleanup-sessions.ts
export async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  console.log(`Cleaned up ${result.count} expired sessions`);
}

// Run daily via Vercel Cron, AWS Lambda, or similar
```

---

## 🟢 LOW PRIORITY / BEST PRACTICES

### 21. No Audit Log Cleanup
**Location:** `repositories/audit-log.repository.ts`
**Severity:** LOW

**Issue:** Audit logs will grow indefinitely without retention policy

**Recommendation:** Archive or delete logs older than 1 year.

---

### 22. Missing Database URL in Schema
**Location:** `prisma/schema.prisma:7-9`
**Severity:** LOW

**Issue:**
```prisma
datasource db {
  provider = "postgresql"
  // Missing: url = env("DATABASE_URL")
}
```

**Impact:** Relies on implicit environment variable loading

**Recommendation:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### 23. No Input Sanitization for XSS
**Location:** API routes
**Severity:** LOW

**Issue:** User inputs are not sanitized before storage (though Next.js escapes output by default)

**Recommendation:**
Use a library like `dompurify` for HTML inputs or strip scripts:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

---

## Performance Observations

### N+1 Query Patterns
Several services exhibit N+1 query patterns:

**Example in POS Service:**
```typescript
// Line 158: Fetches products
const products = await prisma.product.findMany({
  where: { id: { in: productIds } },
  include: {
    productUOMs: true,
    Inventory: { where: { warehouseId: data.warehouseId } },
  },
});

// Good! This uses proper includes, avoiding N+1
```

Most services use proper includes. ✅

---

## Functional Bugs

### No Database Connection String
The Prisma schema is missing the `url` field in the datasource block. While it works via environment variables, this should be explicit.

---

## Security Best Practices Checklist

| Practice | Status | Notes |
|----------|--------|-------|
| Input validation | ✅ Partial | Zod schemas exist but not used everywhere |
| Output encoding | ✅ Good | Next.js auto-escapes |
| Authentication | ⚠️ Needs fixes | JWT issues, timing attacks |
| Authorization | ⚠️ Needs fixes | Missing on critical routes |
| CSRF protection | ❌ Vulnerable | Authorization header bypass |
| Rate limiting | ❌ Incomplete | Only login protected |
| SQL injection | ✅ Good | Using Prisma ORM |
| XSS protection | ✅ Good | No dangerouslySetInnerHTML found |
| Secure cookies | ✅ Good | HTTP-only, secure in prod |
| Password hashing | ✅ Good | bcrypt with 12 rounds |
| Session management | ⚠️ Needs cleanup | Missing expiry cleanup |
| Audit logging | ✅ Good | Comprehensive logging |
| Error handling | ⚠️ Leaky | Exposes stack traces |
| HTTPS enforcement | ⚠️ Unknown | Depends on deployment |

---

## Recommended Action Plan

### Phase 1: Immediate (This Week)
1. ✅ Add authentication to database management endpoints
2. ✅ Fix JWT_SECRET handling and fail-fast on missing secret
3. ✅ Implement proper rate limiting (Redis/Upstash)
4. ✅ Fix timing attack in login
5. ✅ Add password complexity requirements

### Phase 2: Short-term (This Month)
6. ✅ Remove build error suppression and fix type errors
7. ✅ Restrict image hosting to specific domains
8. ✅ Replace console.log with proper logging service
9. ✅ Add pagination to all list endpoints
10. ✅ Fix race condition in POS inventory deduction

### Phase 3: Medium-term (Next Quarter)
11. ✅ Migrate Float to Decimal for currency fields
12. ✅ Add missing database indexes
13. ✅ Implement CORS configuration
14. ✅ Add session cleanup cron job
15. ✅ Implement request body size limits

### Phase 4: Long-term (As Needed)
16. ✅ Enable React Strict Mode and fix warnings
17. ✅ Add audit log retention policy
18. ✅ Implement comprehensive error monitoring (Sentry)
19. ✅ Add integration tests for security-critical flows
20. ✅ Security audit by third party

---

## Conclusion

The InventoryPro application demonstrates **good architectural patterns** with clear separation of concerns, proper use of TypeScript, and comprehensive feature coverage. However, **critical security vulnerabilities** must be addressed before production deployment.

The most pressing issues are:
1. Unprotected database wipe endpoint
2. JWT secret mishandling
3. Rate limiting ineffectiveness
4. CSRF vulnerability

Once these are resolved, the application will have a solid security foundation.

**Overall Risk Level:** 🔴 **HIGH** (due to database wipe endpoint)
**Recommended Status:** ⚠️ **Not ready for production** until Phase 1 is complete

---

## Positive Findings

✅ **Strong points of the codebase:**
- Well-structured layered architecture (routes → services → repositories)
- Comprehensive input validation with Zod schemas
- Proper use of Prisma ORM (prevents SQL injection)
- HTTP-only cookies for token storage
- Strong password hashing (bcrypt, 12 rounds)
- Comprehensive audit logging
- Transaction support for data consistency
- Good TypeScript type coverage
- Clear code organization and naming conventions

---

**Report Generated:** 2025-12-09
**Next Review Recommended:** After Phase 1 fixes are implemented
