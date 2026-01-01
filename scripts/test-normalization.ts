
import { BackupService } from '../services/backup.service';

const testData = {
    version: '1.1',
    data: {
        branches: [{ id: 1, name: 'Test' }],
        companySettings: [{ id: 1, name: 'Company' }]
    }
};

const result = BackupService.normalizeBackupData(testData as any);
console.log('Result version:', result.version);
console.log('Result keys:', Object.keys(result.data));
if (result.data.branch) {
    console.log('✓ Found branch key');
} else {
    console.log('✗ Missing branch key');
}
