"use client";
import React from 'react';

/**
 * CoopAnalyzer Component
 *
 * Provides quick access to the external Cooperative demo application.
 * It displays two premium styled buttons that open the Admin Demo and Member Demo
 * in a new tab. The design follows the project's glassmorphism aesthetic.
 */
export default function CoopAnalyzer() {
    const adminDemoUrl = 'https://neon-db-cooplink-bpaco-323380307458.us-west1.run.app/admin-demo';
    const memberDemoUrl = 'https://neon-db-cooplink-bpaco-323380307458.us-west1.run.app/member-demo';

    const buttonStyle = {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        padding: '1rem 2rem',
        fontSize: '1.1rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 0.2s, background 0.2s',
        margin: '0.5rem',
        minWidth: '200px',
        textAlign: 'center' as const,
        textDecoration: 'none' as const,
    };

    const handleHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
        (e.currentTarget.style as any).transform = 'scale(1.05)';
        (e.currentTarget.style as any).background = 'rgba(255, 255, 255, 0.25)';
    };

    const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        (e.currentTarget.style as any).transform = 'scale(1)';
        (e.currentTarget.style as any).background = 'rgba(255, 255, 255, 0.15)';
    };

    return (
        <section style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            color: '#fff',
            padding: '2rem',
        }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>Cooperative Demo Analyzer</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <a
                    href={adminDemoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={buttonStyle}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                >
                    Admin Demo
                </a>
                <a
                    href={memberDemoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={buttonStyle}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                >
                    Member Demo
                </a>
            </div>
        </section>
    );
}
