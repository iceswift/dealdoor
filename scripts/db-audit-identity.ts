import { getIdentityIntegrityReport } from '../src/server/services/identity-integrity.service';

const report = await getIdentityIntegrityReport();
console.log(JSON.stringify(report, null, 2));
if (!report.healthy) process.exitCode = 1;
