import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./App.tsx', '../../packages/app/**/*.{tsx,ts}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {},
    },
    plugins: [],
};

export default config;
