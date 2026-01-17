
import { dashboardService } from './services/dashboard.service';

async function main() {
    console.log('Testing getKPIs...');
    try {
        const kpis = await dashboardService.getKPIs();
        console.log('getKPIs success:', JSON.stringify(kpis, null, 2));
    } catch (error: any) {
        console.error('getKPIs failed:', error);
        console.error('Stack:', error.stack);
    }

    console.log('\nTesting getRecentActivities...');
    try {
        const activities = await dashboardService.getRecentActivities();
        console.log('getRecentActivities success:', JSON.stringify(activities, null, 2));
    } catch (error: any) {
        console.error('getRecentActivities failed:', error);
        console.error('Stack:', error.stack);
    }

    console.log('\nTesting getBranchComparison...');
    try {
        const comparison = await dashboardService.getBranchComparison();
        console.log('getBranchComparison success:', JSON.stringify(comparison, null, 2));
    } catch (error: any) {
        console.error('getBranchComparison failed:', error);
        console.error('Stack:', error.stack);
    }
}

main().catch(console.error);
