#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Run SQL migrations for user management system
 */

import { db } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration(filename: string) {
    const filePath = path.join(process.cwd(), 'sql', filename);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Running migration: ${filename}`);
    console.log('='.repeat(60));
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
    }
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    try {
        await db.query(sql);
        console.log(`✅ Migration completed successfully: ${filename}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Migration failed: ${filename}`);
        console.error(error.message);
        return false;
    }
}

async function main() {
    console.log('\n🚀 Starting User Management Database Migrations\n');
    
    const migrations = [
        '001_CREATE_USER_MANAGEMENT_TABLES.sql',
        '002_MIGRATE_EXISTING_USERS.sql'
    ];
    
    let successCount = 0;
    
    for (const migration of migrations) {
        const success = await runMigration(migration);
        if (success) {
            successCount++;
        } else {
            console.log('\n⚠️  Migration failed. Stopping execution.');
            break;
        }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Migration Summary:`);
    console.log(`   Total migrations: ${migrations.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${migrations.length - successCount}`);
    console.log('='.repeat(60));
    
    if (successCount === migrations.length) {
        console.log('\n✨ All migrations completed successfully!\n');
    } else {
        console.log('\n❌ Some migrations failed. Please review the errors above.\n');
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
