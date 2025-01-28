const { historyService } = require('./history-service');
const fs = require('fs').promises;
const path = require('path');

async function createBackup() {
    try {
        console.log('[Cleanup] Starting daily backup...');
        
        // Initialize history service if needed
        await historyService.initialize();
        
        const historyPath = path.join(__dirname, '../listening-history.json');
        const backupDir = path.join(__dirname, '../backups');
        
        // Create backups directory if it doesn't exist
        await fs.mkdir(backupDir, { recursive: true });
        
        // Create new backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `listening-history-${timestamp}.json`);
        await fs.copyFile(historyPath, backupPath);
        
        // Get list of backups and keep only the most recent 3
        const backups = await fs.readdir(backupDir);
        const sortedBackups = backups
            .filter(file => file.startsWith('listening-history-'))
            .sort((a, b) => b.localeCompare(a));
        
        // Remove older backups beyond the 3 most recent
        for (let i = 3; i < sortedBackups.length; i++) {
            const oldBackup = path.join(backupDir, sortedBackups[i]);
            await fs.unlink(oldBackup);
            console.log(`[Cleanup] Removed old backup: ${sortedBackups[i]}`);
        }
        
        console.log(`[Cleanup] Backup complete: ${path.basename(backupPath)}`);
        console.log(`[Cleanup] Maintaining ${Math.min(3, sortedBackups.length)} backups`);
    } catch (error) {
        console.error('[Cleanup] Error during backup:', error);
    }
}

// Run backup every 24 hours
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;
setInterval(createBackup, BACKUP_INTERVAL);

// Run initial backup
createBackup();

process.on('SIGTERM', () => {
    console.log('[Cleanup] Shutting down backup service...');
    process.exit(0);
}); 
