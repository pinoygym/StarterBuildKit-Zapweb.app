import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if needed or default behavior

export default defineConfig({
    datasource: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL,
    },
    seed: {
        command: 'npx tsx prisma/seed.ts',
    },
});
