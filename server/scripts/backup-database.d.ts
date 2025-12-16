interface BackupOptions {
    backupDir?: string;
    maxBackups?: number;
}
declare function backupDatabase(options?: BackupOptions): Promise<string>;
export { backupDatabase };
//# sourceMappingURL=backup-database.d.ts.map