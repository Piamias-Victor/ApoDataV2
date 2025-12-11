// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';
import { KpiDashboard } from '@/components/organisms/KpiDashboard/KpiDashboard';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Animated Background Pattern */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000" />
            </div>

            {/* Grid Pattern Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #000 1px, transparent 1px),
                        linear-gradient(to bottom, #000 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Filter Bar */}
            <FilterBar />

            {/* Main Content */}
            <div className="relative z-10 pt-24 px-8 pb-8">
                <div className="max-w-7xl mx-auto">
                    <KpiDashboard />
                </div>
            </div>
        </div>
    );
}
