const { Client } = require('pg');
const fs = require('fs');

const PROD_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEV_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-noisy-mountain-a18wvzwi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function getSchema(connectionString, label) {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log(`\n✅ Connected to ${label} database`);

        // Get all tables
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

        const schema = { tables: {}, enums: {} };

        // Get Enums
        const enumsResult = await client.query(`
            SELECT t.typname AS enum_name, e.enumlabel AS enum_value
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            ORDER BY t.typname, e.enumsortorder;
        `);

        for (const row of enumsResult.rows) {
            if (!schema.enums[row.enum_name]) {
                schema.enums[row.enum_name] = [];
            }
            schema.enums[row.enum_name].push(row.enum_value);
        }

        for (const row of tablesResult.rows) {
            const tableName = row.table_name;

            // Get columns
            const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

            // Get indexes
            const indexesResult = await client.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = $1
        ORDER BY indexname;
      `, [tableName]);

            // Get foreign keys
            const fkResult = await client.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
        ORDER BY tc.constraint_name;
      `, [tableName]);

             // Get Row Count (Approximate)
             const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);

            schema.tables[tableName] = {
                columns: columnsResult.rows,
                indexes: indexesResult.rows,
                foreignKeys: fkResult.rows,
                rowCount: parseInt(countResult.rows[0].count, 10)
            };
        }

        return schema;
    } catch (error) {
        console.error(`❌ Error connecting to ${label}:`, error.message);
        throw error;
    } finally {
        await client.end();
    }
}

function compareSchemas(devSchema, prodSchema) {
    const differences = [];

    // 1. Compare Enums
    const devEnums = Object.keys(devSchema.enums);
    const prodEnums = Object.keys(prodSchema.enums);
    
    const missingEnums = devEnums.filter(e => !prodEnums.includes(e));
    if (missingEnums.length > 0) differences.push({ type: 'MISSING_ENUMS_IN_PROD', names: missingEnums });

    const extraEnums = prodEnums.filter(e => !devEnums.includes(e));
    if (extraEnums.length > 0) differences.push({ type: 'EXTRA_ENUMS_IN_PROD', names: extraEnums });

    const commonEnums = devEnums.filter(e => prodEnums.includes(e));
    for (const enumName of commonEnums) {
        const devVals = JSON.stringify(devSchema.enums[enumName]);
        const prodVals = JSON.stringify(prodSchema.enums[enumName]);
        if (devVals !== prodVals) {
            differences.push({ 
                type: 'ENUM_VALUE_MISMATCH', 
                name: enumName, 
                dev: devSchema.enums[enumName], 
                prod: prodSchema.enums[enumName] 
            });
        }
    }

    // 2. Compare Tables
    const devTables = Object.keys(devSchema.tables);
    const prodTables = Object.keys(prodSchema.tables);

    const missingInProd = devTables.filter(t => !prodTables.includes(t));
    const missingInDev = prodTables.filter(t => !devTables.includes(t));
    const commonTables = devTables.filter(t => prodTables.includes(t));

    if (missingInProd.length > 0) differences.push({ type: 'MISSING_TABLES_IN_PROD', tables: missingInProd });
    if (missingInDev.length > 0) differences.push({ type: 'EXTRA_TABLES_IN_PROD', tables: missingInDev });

    for (const table of commonTables) {
        const devTable = devSchema.tables[table];
        const prodTable = prodSchema.tables[table];

        // 3. Compare Columns
        const devCols = devTable.columns.map(c => c.column_name);
        const prodCols = prodTable.columns.map(c => c.column_name);

        const missingCols = devCols.filter(c => !prodCols.includes(c));
        const extraCols = prodCols.filter(c => !devCols.includes(c));

        if (missingCols.length > 0) differences.push({ type: 'MISSING_COLUMNS_IN_PROD', table, columns: missingCols });
        if (extraCols.length > 0) differences.push({ type: 'EXTRA_COLUMNS_IN_PROD', table, columns: extraCols });

        const commonCols = devCols.filter(c => prodCols.includes(c));
        for (const col of commonCols) {
            const dCol = devTable.columns.find(c => c.column_name === col);
            const pCol = prodTable.columns.find(c => c.column_name === col);

            if (dCol.data_type !== pCol.data_type || 
                dCol.is_nullable !== pCol.is_nullable || 
                dCol.column_default !== pCol.column_default) {
                differences.push({
                    type: 'COLUMN_MISMATCH_DETAILS',
                    table,
                    column: col,
                    dev: { type: dCol.data_type, nullable: dCol.is_nullable, default: dCol.column_default },
                    prod: { type: pCol.data_type, nullable: pCol.is_nullable, default: pCol.column_default }
                });
            }
        }

        // 4. Compare Indexes
        const devIndexes = devTable.indexes.map(i => i.indexdef); // Compare definition directly
        const prodIndexes = prodTable.indexes.map(i => i.indexdef);
        
        const missingIndexes = devIndexes.filter(i => !prodIndexes.includes(i));
        const extraIndexes = prodIndexes.filter(i => !devIndexes.includes(i));

        if (missingIndexes.length > 0) differences.push({ type: 'MISSING_INDEXES_IN_PROD', table, indexes: missingIndexes });
        if (extraIndexes.length > 0) differences.push({ type: 'EXTRA_INDEXES_IN_PROD', table, indexes: extraIndexes });

        // 5. Compare Row Counts (Just for info, unlikely to be equal)
        if (devTable.rowCount !== prodTable.rowCount) {
            differences.push({ 
                type: 'ROW_COUNT_MISMATCH', 
                table, 
                devCount: devTable.rowCount, 
                prodCount: prodTable.rowCount,
                infoOnly: true
            });
        }
    }

    return differences;
}

async function main() {
    console.log('🔍 DEEP Comparing Neon Database Schemas...\n');
    console.log('📊 Development DB: ep-noisy-mountain-a18wvzwi');
    console.log('📊 Production DB: ep-blue-mouse-a128nyc9');

    try {
        const devSchema = await getSchema(DEV_URL, 'DEVELOPMENT');
        const prodSchema = await getSchema(PROD_URL, 'PRODUCTION');

        const allDifferences = compareSchemas(devSchema, prodSchema);
        
        // Filter out row count mismatches for the "Schema" verdict
        const schemaDifferences = allDifferences.filter(d => !d.infoOnly);
        const dataDifferences = allDifferences.filter(d => d.infoOnly);

        console.log('\n' + '='.repeat(60));
        console.log('📋 DEEP SCHEMA VERIFICATION REPORT');
        console.log('='.repeat(60) + '\n');

        if (schemaDifferences.length === 0) {
            console.log('✅ STRICT SCHEMA MATCH: SUCCESS!');
            console.log('Structure, Types, Enums, Defaults, and Indexes are identical.\n');
        } else {
            console.log(`❌ SCHEMA MISMATCH: Found ${schemaDifferences.length} structural differences.\n`);
            schemaDifferences.forEach((diff, index) => {
                 console.log(`${index + 1}. [${diff.type}]`);
                 console.log(JSON.stringify(diff, null, 2));
                 console.log('');
            });
        }

        if (dataDifferences.length > 0) {
             console.log('ℹ️  Data Count Differences (Expected):');
             dataDifferences.forEach(d => {
                 console.log(`   - ${d.table}: Dev=${d.devCount}, Prod=${d.prodCount}`);
             });
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
