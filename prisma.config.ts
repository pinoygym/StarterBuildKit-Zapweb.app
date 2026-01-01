import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
    datasource: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL,
    },
    seed: {
        command: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
    },
});
