
import dotenv from 'dotenv';
dotenv.config();

async function testImports() {
    try {
        console.log('Importing customerService...');
        const { customerService } = await import('./services/customer.service');
        console.log('customerService imported successfully');

        console.log('Importing customerValidation...');
        const validation = await import('./lib/validations/customer.validation');
        console.log('Importing AppError...');
        const errors = await import('./lib/errors');
        console.log('AppError imported successfully');

        console.log('Importing types...');
        const types = await import('./types/customer.types');
        console.log('Types imported successfully');

    } catch (error) {
        console.error('Import failed:', error);
    }
}

testImports();
