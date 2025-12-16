import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

async function askQuestion(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function restoreDatabase(backupFile?: string) {
    try {
        const backupDir = path.join(process.cwd(), 'backups');

        // If no backup file specified, list available backups
        if (!backupFile) {
            if (!fs.existsSync(backupDir)) {
                console.error('❌ No backups directory found!');
                process.exit(1);
            }

            const backups = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('bharatflow_backup_') && file.endsWith('.sql'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    mtime: fs.statSync(path.join(backupDir, file)).mtime
                }))
                .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

            if (backups.length === 0) {
                console.error('❌ No backup files found!');
                process.exit(1);
            }

            console.log('\n📦 Available backups:\n');
            backups.forEach((backup, index) => {
                console.log(`${index + 1}. ${backup.name}`);
                console.log(`   Date: ${backup.mtime.toLocaleString()}\n`);
            });

            const answer = await askQuestion('Enter the number of the backup to restore (or press Enter for the latest): ');

            if (answer.trim() === '') {
                backupFile = backups[0].path;
            } else {
                const index = parseInt(answer) - 1;
                if (index >= 0 && index < backups.length) {
                    backupFile = backups[index].path;
                } else {
                    console.error('❌ Invalid selection!');
                    process.exit(1);
                }
            }
        }

        // Verify backup file exists
        if (!fs.existsSync(backupFile)) {
            console.error(`❌ Backup file not found: ${backupFile}`);
            process.exit(1);
        }

        console.log(`\n⚠️  WARNING: This will overwrite all current data in the database!`);
        console.log(`📦 Restoring from: ${path.basename(backupFile)}`);

        const confirm = await askQuestion('\nAre you sure you want to continue? (yes/no): ');

        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Restore cancelled.');
            process.exit(0);
        }

        console.log(`\n🔄 Starting database restore...`);

        // Execute restore via docker
        const command = `Get-Content "${backupFile}" | docker exec -i bharatflow_postgres psql -U postgres -d bharatflow`;

        await execAsync(command, { shell: 'powershell.exe' });

        console.log(`✅ Database restored successfully!`);
        console.log(`📅 Restored at: ${new Date().toLocaleString()}`);

    } catch (error: any) {
        console.error('❌ Restore failed:', error.message);
        process.exit(1);
    }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

restoreDatabase(backupFile)
    .then(() => {
        console.log('\n✨ Restore process completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Restore process failed!');
        process.exit(1);
    });
