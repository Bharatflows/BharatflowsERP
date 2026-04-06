import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../config/logger';

const execAsync = promisify(exec);

interface BackupOptions {
    backupDir?: string;
    maxBackups?: number;
}

async function backupDatabase(options: BackupOptions = {}) {
    const {
        backupDir = path.join(process.cwd(), 'backups'),
        maxBackups = 7 // Keep last 7 backups
    } = options;

    try {
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            logger.info(`📁 Created backup directory: ${backupDir}`);
        }

        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFile = path.join(backupDir, `bharatflows_backup_${timestamp}.sql`);

        logger.info(`🔄 Starting database backup...`);
        logger.info(`📅 Timestamp: ${new Date().toLocaleString()}`);

        // Execute pg_dump via docker
        const command = `docker exec -t bharatflows_postgres pg_dump -U postgres -d bharatflows > "${backupFile}"`;

        await execAsync(command, { shell: 'powershell.exe' });

        // Verify backup file was created and has content
        if (fs.existsSync(backupFile)) {
            const stats = fs.statSync(backupFile);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            logger.info(`✅ Backup completed successfully!`);
            logger.info(`📦 Backup file: ${backupFile}`);
            logger.info(`📊 File size: ${fileSizeMB} MB`);

            // Clean up old backups
            await cleanupOldBackups(backupDir, maxBackups);

            return backupFile;
        } else {
            throw new Error('Backup file was not created');
        }
    } catch (error: any) {
        logger.error('❌ Backup failed:', error.message);
        throw error;
    }
}

async function cleanupOldBackups(backupDir: string, maxBackups: number) {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('bharatflows_backup_') && file.endsWith('.sql'))
            .map(file => ({
                name: file,
                path: path.join(backupDir, file),
                mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.mtime - a.mtime); // Sort by newest first

        if (files.length > maxBackups) {
            const filesToDelete = files.slice(maxBackups);
            logger.info(`\n🧹 Cleaning up ${filesToDelete.length} old backup(s)...`);

            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                logger.info(`   ❌ Deleted: ${file.name}`);
            }
        }

        logger.info(`\n📋 Current backups (${Math.min(files.length, maxBackups)} kept):`);
        files.slice(0, maxBackups).forEach((file, index) => {
            const date = new Date(file.mtime).toLocaleString();
            logger.info(`   ${index + 1}. ${file.name} (${date})`);
        });

    } catch (error: any) {
        logger.warn('⚠️  Warning: Failed to cleanup old backups:', error.message);
    }
}

// Run backup if called directly
if (require.main === module) {
    backupDatabase()
        .then(() => {
            logger.info('\n✨ Backup process completed!');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('\n💥 Backup process failed!');
            process.exit(1);
        });
}

export { backupDatabase };
