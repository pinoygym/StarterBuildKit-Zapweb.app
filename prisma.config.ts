import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
    datasource: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL,
    },
    seed: {
        command: 'npx tsx prisma/seed.ts',
    },
});
