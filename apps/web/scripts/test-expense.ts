
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Testing Expense models...');
    try {
        console.log('Querying ExpenseCategory...');
        const categories = await prisma.expenseCategory.findMany();
        console.log(`ExpenseCategory count: ${categories.length}`);

        console.log('Querying Expense...');
        const expenses = await prisma.expense.findMany();
        console.log(`Expense count: ${expenses.length}`);

    } catch (error: any) {
        console.error('Test failed!');
        console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.meta) console.error('Error meta:', JSON.stringify(error.meta, null, 2));
    } finally {
        // lib/prisma handles disconnect on exit usually, but we can try to facilitate it
        // process.exit(0); // Let the process exit naturally
    }
}

main();
