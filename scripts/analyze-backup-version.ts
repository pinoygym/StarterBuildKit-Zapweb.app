/**
 * Script to test backup version compatibility
 * Demonstrates the difference between v1.1 and v2.0 formats
 */

import fs from 'fs/promises';
import path from 'path';

interface BackupV1 {
    version: string;
    timestamp: string;
    data: Record<string, any[]>; // Plural keys
}

interface BackupV2 {
    version: string;
    timestamp: string;
    data: Record<string, any[]>; // Singular keys
}

async function analyzeBackup(filePath: string) {
    console.log('='.repeat(80));
    console.log('BACKUP VERSION COMPATIBILITY ANALYZER');
    console.log('='.repeat(80));
    console.log();

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const backup = JSON.parse(fileContent);

        console.log(`📁 File: ${path.basename(filePath)}`);
        console.log(`📅 Timestamp: ${backup.timestamp}`);
        console.log(`🔖 Version: ${backup.version}`);
        console.log();

        // Analyze data keys
        const dataKeys = Object.keys(backup.data || {});
        console.log(`📊 Total data keys: ${dataKeys.length}`);
        console.log();

        // Check for plural vs singular
        const pluralKeys = dataKeys.filter(key => {
            const singular = getSingularForm(key);
            return singular !== key;
        });

        const singularKeys = dataKeys.filter(key => {
            const singular = getSingularForm(key);
            return singular === key;
        });

        console.log('🔍 Key Format Analysis:');
        console.log(`  Plural keys: ${pluralKeys.length}`);
        console.log(`  Singular keys: ${singularKeys.length}`);
        console.log();

        if (backup.version === '1.1' || pluralKeys.length > 0) {
            console.log('⚠️  VERSION 1.1 DETECTED (Plural Keys)');
            console.log();
            console.log('❌ COMPATIBILITY ISSUE:');
            console.log('   This backup uses PLURAL keys (e.g., "branches", "warehouses")');
            console.log('   Current BackupService expects SINGULAR keys (e.g., "branch", "warehouse")');
            console.log();
            console.log('🔧 REQUIRED ACTION:');
            console.log('   Convert plural keys to singular before restoring');
            console.log();

            // Show sample conversions needed
            console.log('📝 Sample conversions needed:');
            pluralKeys.slice(0, 10).forEach(key => {
                const singular = getSingularForm(key);
                const count = backup.data[key]?.length || 0;
                console.log(`   "${key}" → "${singular}" (${count} records)`);
            });

            if (pluralKeys.length > 10) {
                console.log(`   ... and ${pluralKeys.length - 10} more`);
            }
        } else {
            console.log('✅ VERSION 2.0 DETECTED (Singular Keys)');
            console.log();
            console.log('✅ COMPATIBLE:');
            console.log('   This backup is compatible with current BackupService');
            console.log('   Can be restored without conversion');
        }

        console.log();
        console.log('📈 Data Summary:');
        const sortedKeys = dataKeys.sort();
        sortedKeys.forEach(key => {
            const count = backup.data[key]?.length || 0;
            if (count > 0) {
                console.log(`   ${key.padEnd(30)} ${count.toString().padStart(6)} records`);
            }
        });

        console.log();
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error analyzing backup:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
        }
    }
}

function getSingularForm(plural: string): string {
    // Simple pluralization rules (matches common patterns)
    if (plural.endsWith('ies')) {
        return plural.slice(0, -3) + 'y'; // categories → category
    }
    if (plural.endsWith('ses')) {
        return plural.slice(0, -2); // branches → branch (not perfect but close)
    }
    if (plural.endsWith('s')) {
        return plural.slice(0, -1); // users → user
    }
    return plural;
}

// Run analysis
const backupPath = process.argv[2] || path.join(process.cwd(), 'Ormoc_Buenas_Shoppers_2025-12-31_08-39-49.json');
analyzeBackup(backupPath);
