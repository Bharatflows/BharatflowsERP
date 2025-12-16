import { backupDatabase } from './backup-database';

/**
 * Scheduled Backup Service
 * Runs automatic backups at configured intervals
 */

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const BACKUP_ON_STARTUP = true;

let backupInterval: NodeJS.Timeout | null = null;

async function runScheduledBackup() {
    console.log('\n📅 [Scheduled Backup] Starting automatic backup...');
    try {
        await backupDatabase();
        console.log('[Scheduled Backup] ✅ Backup completed successfully\n');
    } catch (error: any) {
        console.error('[Scheduled Backup] ❌ Backup failed:', error.message);
    }
}

export function startScheduledBackups() {
    console.log('🔧 [Scheduled Backup] Initializing automatic backup service...');
    console.log(`   📆 Backup Interval: Every ${BACKUP_INTERVAL_MS / (1000 * 60 * 60)} hours`);
    console.log(`   🚀 Backup on Startup: ${BACKUP_ON_STARTUP}`);

    // Run backup on startup if enabled
    if (BACKUP_ON_STARTUP) {
        // Delay startup backup by 10 seconds to allow server to fully start
        setTimeout(() => {
            console.log('\n🚀 [Scheduled Backup] Running startup backup...');
            runScheduledBackup();
        }, 10000);
    }

    // Set up recurring backup
    backupInterval = setInterval(runScheduledBackup, BACKUP_INTERVAL_MS);
    console.log('✅ [Scheduled Backup] Automatic backup service started\n');
}

export function stopScheduledBackups() {
    if (backupInterval) {
        clearInterval(backupInterval);
        backupInterval = null;
        console.log('🛑 [Scheduled Backup] Automatic backup service stopped');
    }
}
