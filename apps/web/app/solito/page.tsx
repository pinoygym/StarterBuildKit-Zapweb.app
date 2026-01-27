'use client'
import { LoginScreen } from '@inventory-pro/app/src/features/auth/LoginScreen';

export default function SolitoPage() {
    return (
        <div style={{ flex: 1, display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
            <div style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
                <LoginScreen />
            </div>
        </div>
    );
}
