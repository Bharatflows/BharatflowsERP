import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

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
            console.log(`📁 Created backup directory: ${backupDir}`);
        }

        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFile = path.join(backupDir, `bharatflow_backup_${timestamp}.sql`);

        console.log(`🔄 Starting database backup...`);
        console.log(`📅 Timestamp: ${new Date().toLocaleString()}`);

        // Execute pg_dump via docker
        const command = `docker exec -t bharatflow_postgres pg_dump -U postgres -d bharatflow > "${backupFile}"`;

        await execAsync(command, { shell: 'powershell.exe' });

        // Verify backup file was created and has content
        if (fs.existsSync(backupFile)) {
            const stats = fs.statSync(backupFile);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(`✅ Backup completed successfully!`);
            console.log(`📦 Backup file: ${backupFile}`);
            console.log(`📊 File size: ${fileSizeMB} MB`);

            // Clean up old backups
            await cleanupOldBackups(backupDir, maxBackups);

            return backupFile;
        } else {
            throw new Error('Backup file was not created');
        }
    } catch (error: any) {
        console.error('❌ Backup failed:', error.message);
        throw error;
    }
}

async function cleanupOldBackups(backupDir: string, maxBackups: number) {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('bharatflow_backup_') && file.endsWith('.sql'))
            .map(file => ({
                name: file,
                path: path.join(backupDir, file),
                mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.mtime - a.mtime); // Sort by newest first

        if (files.length > maxBackups) {
            const filesToDelete = files.slice(maxBackups);
            console.log(`\n🧹 Cleaning up ${filesToDelete.length} old backup(s)...`);

            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`   ❌ Deleted: ${file.name}`);
            }
        }

        console.log(`\n📋 Current backups (${Math.min(files.length, maxBackups)} kept):`);
        files.slice(0, maxBackups).forEach((file, index) => {
            const date = new Date(file.mtime).toLocaleString();
            console.log(`   ${index + 1}. ${file.name} (${date})`);
        });
    } catch (error: any) {
        console.error('⚠️  Warning: Failed to cleanup old backups:', error.message);
    }
}

// Run backup if called directly
if (require.main === module) {
    backupDatabase()
        .then(() => {
            console.log('\n✨ Backup process completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Backup process failed!');
            process.exit(1);
        });
}

export { backupDatabase };
