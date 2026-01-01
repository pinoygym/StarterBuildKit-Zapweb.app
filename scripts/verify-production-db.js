/**
 * Script to verify admin user exists in production database
 * and compare database configurations
 * 
 * Usage:
 *   node scripts/verify-production-db.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Database configurations
const databases = {
    development: {
        name: 'Development (ep-noisy-mountain)',
        url: 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-noisy-mountain-a18wvzwi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        branch: 'ep-noisy-mountain-a18wvzwi'
    },
    production: {
        name: 'Production (ep-blue-mouse)',
        url: 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        branch: 'ep-blue-mouse-a128nyc9'
    },
    vercel: {
        name: 'Vercel Deployment',
        url: 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-noisy-mountain-a18wvzwi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        branch: 'ep-noisy-mountain-a18wvzwi'
    }
};

const ADMIN_EMAIL = 'cybergada@gmail.com';

async function checkDatabase(dbConfig) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Checking: ${dbConfig.name}`);
    console.log(`Branch: ${dbConfig.branch}`);
    console.log(`${'='.repeat(80)}\n`);

    // Create a temporary script that will use the specific DATABASE_URL
    const checkScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');

    const adminUser = await prisma.user.findUnique({
      where: { email: '${ADMIN_EMAIL}' },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (adminUser) {
      console.log('✅ Admin user found');
      console.log(\`   - ID: \${adminUser.id}\`);
      console.log(\`   - Email: \${adminUser.email}\`);
      console.log(\`   - Name: \${adminUser.name}\`);
      console.log(\`   - Role: \${adminUser.role?.name || 'No role assigned'}\`);
      console.log(\`   - Status: \${adminUser.status}\`);
      console.log(\`   - Created: \${adminUser.createdAt}\`);
      
      if (adminUser.role) {
        console.log(\`   - Permissions: \${adminUser.role.permissions.length} permissions\`);
      }
    } else {
      console.log('❌ Admin user NOT found');
      console.log(\`   Expected email: ${ADMIN_EMAIL}\`);
    }

    const userCount = await prisma.user.count();
    console.log(\`\\n📊 Total users in database: \${userCount}\`);

    const roleCount = await prisma.role.count();
    console.log(\`📊 Total roles in database: \${roleCount}\`);

    const branchCount = await prisma.branch.count();
    console.log(\`📊 Total branches in database: \${branchCount}\`);

    const productCount = await prisma.product.count();
    console.log(\`📊 Total products in database: \${productCount}\`);

    const result = {
      hasAdmin: !!adminUser,
      stats: {
        users: userCount,
        roles: roleCount,
        branches: branchCount,
        products: productCount
      }
    };

    console.log(JSON.stringify(result));

  } catch (error) {
    console.log('❌ Error checking database');
    console.error(\`   Error: \${error.message}\`);
    console.log(JSON.stringify({ error: error.message }));
  } finally {
    await prisma.$disconnect();
  }
}

check();
  `;

    try {
        const { stdout, stderr } = await execPromise(`node -e "${checkScript.replace(/"/g, '\\"')}"`, {
            env: { ...process.env, DATABASE_URL: dbConfig.url }
        });

        console.log(stdout);

        // Extract JSON result from output
        const jsonMatch = stdout.match(/\{.*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { success: false };
    } catch (error) {
        console.error(error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('\n🔍 VERIFYING PRODUCTION DATABASE CONFIGURATION\n');
    console.log('This script will check:');
    console.log('1. Which database Vercel is using');
    console.log('2. If admin user exists in each database');
    console.log('3. Database statistics\n');

    const results = {};

    // Check Development database
    results.development = await checkDatabase(databases.development);

    // Check Production database
    results.production = await checkDatabase(databases.production);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('🔍 VERCEL CONFIGURATION:');
    console.log(`   Vercel is using: ${databases.vercel.name}`);
    console.log(`   Branch: ${databases.vercel.branch}`);

    if (databases.vercel.branch === databases.development.branch) {
        console.log('   ⚠️  WARNING: Vercel is using the DEVELOPMENT database!');
    } else if (databases.vercel.branch === databases.production.branch) {
        console.log('   ✅ Vercel is using the PRODUCTION database');
    }

    console.log('\n📊 ADMIN USER STATUS:');
    console.log(`   Development: ${results.development?.hasAdmin ? '✅ Found' : '❌ Not Found'}`);
    console.log(`   Production: ${results.production?.hasAdmin ? '✅ Found' : '❌ Not Found'}`);

    console.log('\n📊 DATABASE STATISTICS:');
    console.log('\n   Development:');
    if (results.development?.stats) {
        console.log(`     - Users: ${results.development.stats.users}`);
        console.log(`     - Roles: ${results.development.stats.roles}`);
        console.log(`     - Branches: ${results.development.stats.branches}`);
        console.log(`     - Products: ${results.development.stats.products}`);
    }

    console.log('\n   Production:');
    if (results.production?.stats) {
        console.log(`     - Users: ${results.production.stats.users}`);
        console.log(`     - Roles: ${results.production.stats.roles}`);
        console.log(`     - Branches: ${results.production.stats.branches}`);
        console.log(`     - Products: ${results.production.stats.products}`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');

    if (!results.production?.hasAdmin && results.development?.hasAdmin) {
        console.log('   ⚠️  Production database is missing the admin user');
        console.log('   → Run: node scripts/seed-production.js');
    }

    if (databases.vercel.branch === databases.development.branch) {
        console.log('   ⚠️  Vercel is pointing to development database');
        console.log('   → Update DATABASE_URL in Vercel to use production branch');
        console.log('   → Production URL: ' + databases.production.url);
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

main()
    .catch(console.error)
    .finally(() => process.exit(0));
