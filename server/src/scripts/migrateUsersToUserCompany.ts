/**
 * Migration Script: User.companyId → UserCompany
 * 
 * This script migrates existing users with companyId to the new UserCompany
 * junction table for multi-company support (P0-1).
 * 
 * Usage:
 *   npx ts-node src/scripts/migrateUsersToUserCompany.ts
 *   npx ts-node src/scripts/migrateUsersToUserCompany.ts --dry-run
 * 
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsersToUserCompany(dryRun = false) {
    console.log('='.repeat(60));
    console.log('User → UserCompany Migration');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
    console.log('');

    try {
        // Find all users with a companyId that don't have a UserCompany record
        const usersWithCompany = await prisma.user.findMany({
            where: {
                companyId: { not: null }
            },
            select: {
                id: true,
                email: true,
                name: true,
                companyId: true,
                role: true,
                userCompanies: {
                    select: { id: true }
                }
            }
        });

        console.log(`Found ${usersWithCompany.length} users with companyId`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of usersWithCompany) {
            // Skip if user already has a UserCompany record for this company
            if (user.userCompanies && user.userCompanies.length > 0) {
                console.log(`  ⏭️  ${user.email} - Already has UserCompany records, skipping`);
                skipped++;
                continue;
            }

            if (!user.companyId) {
                console.log(`  ⚠️  ${user.email} - No companyId, skipping`);
                skipped++;
                continue;
            }

            console.log(`  📦 ${user.email} → Creating UserCompany (role: ${user.role})`);

            if (!dryRun) {
                try {
                    await prisma.userCompany.create({
                        data: {
                            userId: user.id,
                            companyId: user.companyId,
                            role: user.role || 'STAFF',
                            isDefault: true,
                            isActive: true
                        }
                    });
                    migrated++;
                } catch (err: any) {
                    console.error(`  ❌ Error for ${user.email}: ${err.message}`);
                    errors++;
                }
            } else {
                migrated++;
            }
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('Summary:');
        console.log(`  ✅ Migrated: ${migrated}`);
        console.log(`  ⏭️  Skipped:  ${skipped}`);
        console.log(`  ❌ Errors:   ${errors}`);
        console.log('='.repeat(60));

        if (dryRun) {
            console.log('');
            console.log('This was a DRY RUN. Run without --dry-run to apply changes.');
        }

    } catch (error: any) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

migrateUsersToUserCompany(dryRun);
