'use client'
import { Simple } from '@inventory-pro/app/src/Simple';

export default function SimplePage() {
    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h1>Web Test Page</h1>
            <Simple />
        </div>
    );
}
