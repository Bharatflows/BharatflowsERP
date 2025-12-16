"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupDatabase = backupDatabase;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function backupDatabase(options = {}) {
    const { backupDir = path.join(process.cwd(), 'backups'), maxBackups = 7 // Keep last 7 backups
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
        }
        else {
            throw new Error('Backup file was not created');
        }
    }
    catch (error) {
        console.error('❌ Backup failed:', error.message);
        throw error;
    }
}
async function cleanupOldBackups(backupDir, maxBackups) {
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
    }
    catch (error) {
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
//# sourceMappingURL=backup-database.js.map