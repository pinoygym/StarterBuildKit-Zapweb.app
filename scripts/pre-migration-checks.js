#!/usr/bin/env node

/**
 * Pre-Migration Checks
 * Run this before creating a new migration to ensure safety
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Migration Safety Checks...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Verify Prisma schema is valid
console.log('✓ Check 1: Validating Prisma schema...');
try {
  execSync('npx prisma validate', { stdio: 'pipe' });
  console.log('  ✅ Schema is valid\n');
} catch (error) {
  console.error('  ❌ Schema validation failed!');
  console.error(error.stdout.toString());
  hasErrors = true;
}

// Check 2: Check for pending changes
console.log('✓ Check 2: Checking for schema drift...');
try {
  const result = execSync('npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  if (result.includes('This is an empty migration')) {
    console.log('  ✅ No schema changes detected\n');
  } else {
    console.log('  ⚠️  Schema changes detected:');
    console.log(result);
    hasWarnings = true;
  }
} catch (error) {
  console.error('  ❌ Failed to check schema drift');
  hasErrors = true;
}

// Check 3: Verify all migrations are applied
console.log('✓ Check 3: Checking migration status...');
try {
  const status = execSync('npx prisma migrate status', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  if (status.includes('Database schema is up to date')) {
    console.log('  ✅ All migrations are applied\n');
  } else if (status.includes('following migration have not yet been applied')) {
    console.log('  ⚠️  Warning: Pending migrations detected');
    console.log(status);
    hasWarnings = true;
  }
} catch (error) {
  console.error('  ❌ Failed to check migration status');
  console.error(error.stderr?.toString() || error.message);
  hasErrors = true;
}

// Check 4: Verify no breaking changes
console.log('✓ Check 4: Analyzing for potential data loss...');
try {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const dangerousPatterns = [
    { pattern: /@map\s*\(\s*["']/, message: 'Column rename detected (potential data loss)' },
    { pattern: /@@map\s*\(\s*["']/, message: 'Table rename detected (potential data loss)' },
  ];

  let foundDangerousPatterns = false;
  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(schema)) {
      console.log(`  ⚠️  ${message}`);
      foundDangerousPatterns = true;
      hasWarnings = true;
    }
  });

  if (!foundDangerousPatterns) {
    console.log('  ✅ No obvious data loss risks detected\n');
  } else {
    console.log('  ⚠️  Please review changes carefully\n');
  }
} catch (error) {
  console.error('  ❌ Failed to analyze schema');
  hasErrors = true;
}

// Check 5: Verify TypeScript compilation
console.log('✓ Check 5: Checking TypeScript types (quick check)...');
try {
  execSync('npx tsc --noEmit --skipLibCheck', {
    stdio: 'pipe',
    timeout: 30000
  });
  console.log('  ✅ TypeScript types are valid\n');
} catch (error) {
  console.log('  ⚠️  TypeScript errors found (non-blocking)');
  hasWarnings = true;
}

// Check 6: Compare with production
console.log('✓ Check 6: Comparing with production schema...');
try {
  const comparison = execSync('node scripts/compare-neon-schemas.js', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  if (comparison.includes('STRICT SCHEMA MATCH: SUCCESS')) {
    console.log('  ✅ Dev and Production schemas are in sync\n');
  } else if (comparison.includes('SCHEMA MISMATCH')) {
    console.log('  ⚠️  Dev and Production schemas differ');
    console.log('  This is expected if you have pending migrations');
    console.log('  Make sure to deploy migrations to production after testing\n');
    hasWarnings = true;
  }
} catch (error) {
  console.log('  ⚠️  Could not compare schemas (non-blocking)\n');
  hasWarnings = true;
}

// Summary
console.log('='.repeat(60));
console.log('📋 Pre-Migration Check Summary');
console.log('='.repeat(60));

if (hasErrors) {
  console.log('\n❌ ERRORS FOUND - Please fix errors before creating migration\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS FOUND - Please review before proceeding\n');
  console.log('Continue with migration creation? (Run: npx prisma migrate dev)\n');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED - Safe to create migration\n');
  console.log('Next step: npx prisma migrate dev --name your_migration_name\n');
  process.exit(0);
}
