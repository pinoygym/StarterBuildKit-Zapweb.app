import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv'; // Fallback for loading environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL ?? '',
        directUrl: process.env.DATABASE_URL_UNPOOLED,
    },
});
