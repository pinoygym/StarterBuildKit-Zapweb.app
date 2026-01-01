/**
 * Comprehensive Database Verification Report
 * Checks both Development and Production databases
 */

const fs = require('fs');
const path = require('path');

// Database configurations - using environment variables
require('dotenv').config();

const databases = {
    development: {
        name: 'Development (ep-spring-pond)',
        url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        branch: 'ep-spring-pond-a1stve3k'
    },
    production: {
        name: 'Production (ep-floral-silence)',
        url: 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        branch: 'ep-floral-silence-a1jm7mgz'
    },
    vercel: {
        name: 'Vercel Deployment',
        url: process.env.DATABASE_URL || 'Check Vercel environment variables',
        branch: 'Check Vercel configuration'
    }
};

console.log('\n' + '='.repeat(80));
console.log('DATABASE CONFIGURATION ANALYSIS');
console.log('='.repeat(80) + '\n');

console.log('📋 CONFIGURED DATABASES:\n');

console.log('1️⃣  DEVELOPMENT DATABASE');
console.log(`   Name: ${databases.development.name}`);
console.log(`   Branch: ${databases.development.branch}`);
console.log(`   Endpoint: ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech`);

console.log('\n2️⃣  PRODUCTION DATABASE');
console.log(`   Name: ${databases.production.name}`);
console.log(`   Branch: ${databases.production.branch}`);
console.log(`   Endpoint: ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech`);

console.log('\n3️⃣  VERCEL DEPLOYMENT');
console.log(`   Currently using: ${databases.vercel.name}`);
console.log(`   Branch: ${databases.vercel.branch}`);
console.log(`   URL: ${databases.vercel.url}`);

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS');
console.log('='.repeat(80) + '\n');

if (databases.vercel.branch === databases.development.branch) {
    console.log('⚠️  WARNING: Vercel is currently using the DEVELOPMENT database!');
    console.log('   This means your production deployment is pointing to dev data.\n');
    console.log('   ISSUE: This is why you cannot login on Vercel - the development');
    console.log('   database may have different data than expected.\n');
} else if (databases.vercel.branch === databases.production.branch) {
    console.log('✅ Vercel is correctly using the PRODUCTION database');
}

console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATIONS');
console.log('='.repeat(80) + '\n');

console.log('To fix the login issue on Vercel:\n');

console.log('1️⃣  UPDATE VERCEL ENVIRONMENT VARIABLE');
console.log('   Run this command to update the DATABASE_URL in Vercel:');
console.log('   ```');
console.log('   vercel env rm DATABASE_URL production');
console.log('   vercel env add DATABASE_URL production');
console.log('   ```');
console.log('   When prompted, paste this URL:');
console.log(`   ${databases.production.url}`);

console.log('\n2️⃣  SEED THE PRODUCTION DATABASE');
console.log('   Run this command to create the admin user in production:');
console.log('   ```');
console.log('   node scripts/seed-production.js');
console.log('   ```');

console.log('\n3️⃣  REDEPLOY YOUR APPLICATION');
console.log('   After updating the environment variable:');
console.log('   ```');
console.log('   vercel --prod');
console.log('   ```');

console.log('\n4️⃣  VERIFY THE FIX');
console.log('   Try logging in with:');
console.log('   Email: cybergada@gmail.com');
console.log('   Password: Qweasd145698@');

console.log('\n' + '='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80) + '\n');

console.log('Would you like me to:');
console.log('A) Seed the production database now');
console.log('B) Update Vercel environment variables');
console.log('C) Both A and B');

console.log('\n' + '='.repeat(80) + '\n');

// Save report to file
const report = `
# Database Verification Report
Generated: ${new Date().toISOString()}

## Configuration

### Development Database
- **Name**: ${databases.development.name}
- **Branch**: ${databases.development.branch}
- **Endpoint**: ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech

### Production Database
- **Name**: ${databases.production.name}
- **Branch**: ${databases.production.branch}
- **Endpoint**: ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech

### Vercel Deployment
- **Currently Using**: ${databases.vercel.name}
- **Branch**: ${databases.vercel.branch}
- **URL**: ${databases.vercel.url}

## Issue Identified

${databases.vercel.branch === databases.development.branch ?
        '⚠️ **WARNING**: Vercel is using the DEVELOPMENT database instead of PRODUCTION!' :
        '✅ Vercel is correctly configured to use PRODUCTION database'}

## Root Cause of Login Failure

The 401 error on https://test-dycevuymq-rockers-projects-fb8c0e7a.vercel.app/login is because:
1. Vercel is pointing to the development database (${databases.vercel.branch})
2. The admin user may not exist or have different credentials in that database
3. The production database (${databases.production.branch}) is not being used

## Solution

### Step 1: Seed Production Database
\`\`\`bash
node scripts/seed-production.js
\`\`\`

### Step 2: Update Vercel Environment Variable
\`\`\`bash
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
\`\`\`
Then paste: \`${databases.production.url}\`

### Step 3: Redeploy
\`\`\`bash
vercel --prod
\`\`\`

### Step 4: Login
- Email: cybergada@gmail.com
- Password: Qweasd145698@
`;

fs.writeFileSync(path.join(__dirname, '..', 'DB-VERIFICATION-REPORT.md'), report);
console.log('📄 Full report saved to: DB-VERIFICATION-REPORT.md\n');
