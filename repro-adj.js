const { inventoryAdjustmentService } = require('./services/inventory-adjustment.service');

async function run() {
    try {
        console.log('Fetching adjustments...');
        const result = await inventoryAdjustmentService.findAll({
            page: 1,
            limit: 10
        });
        console.log('Success:', result.data.length, 'adjustments found');
    } catch (error) {
        console.error('FAILED to fetch adjustments:');
        console.error(error);
    }
}

run();
