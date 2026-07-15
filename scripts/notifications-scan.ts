import { executeNotificationScan } from '../src/server/services/notification.service';

const result = await executeNotificationScan();
console.log(`Notification scan ${result.status}.`, result);
if (result.status === 'failed') process.exitCode = 1;
