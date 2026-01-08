'use client';

import React from 'react';
import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';
import { GenericLaboratoryTable } from '@/components/organisms/GenericAnalysis/GenericLaboratoryTable';
import { GroupSelector } from '@/components/molecules/GroupSelector/GroupSelector';
import { KpiDashboard } from '@/components/organisms/KpiDashboard/KpiDashboard';
import { SupplierAnalysisTable } from '@/components/organisms/GenericAnalysis/SupplierAnalysisTable';
import { GenericProductTable } from '@/components/organisms/GenericAnalysis/GenericProductTable';
import { AlertTriangle } from 'lucide-react';

export default function GenericAnalysisPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-[68px]">
            {/* Animated Background Pattern (From Dashboard) */}
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
            <div className="relative z-10 pt-8 px-8 pb-8">
                <div className="max-w-7xl mx-auto space-y-8 pt-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">Analyse Générique</h1>
                        </div>
                        <p className="text-gray-600">
                            Analysez la performance de vos lancements génériques.
                        </p>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                             <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900 text-sm">Précision importante</h3>
                            <p className="text-amber-700 text-sm mt-1">
                                Pour obtenir des résultats pertinents sur cette page, assurez-vous que les filtres sélectionnés correspondent bien à des génériques :<br/>
                                • Filtre <strong>Laboratoire</strong> ou <strong>Produit</strong><br/>
                                • Ou Filtre <strong>Produit {'>'} Par Type {'>'} Générique / Princeps</strong>
                            </p>
                        </div>
                    </div>

                    {/* Group Selector Section */}
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-pink-100 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-pink-100 p-1.5 rounded-lg text-pink-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.35 6.61a1.93 1.93 0 0 0 1.81 0l3.65-1.9a2.12 2.12 0 0 0 .05-3.69Z" /><path d="M4.45 7.73 7 9.09" /><path d="m4.45 7.73 12.35 6.61a1.93 1.93 0 0 0 1.81 0l3.65-1.9" /><path d="M6 13.91V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4.09" /></svg>
                            </span>
                            Sélection des Groupes / Molécules
                        </h2>
                        <GroupSelector />
                    </div>

                    {/* KPI Dashboard */}
                    <KpiDashboard />

                    {/* Generic Lab Table */}
                    {/* Generic Lab Table */}
                    <GenericLaboratoryTable />

                    {/* Supplier Analysis Table */}
                    <SupplierAnalysisTable />

                    {/* Product Analysis Table */}
                    <GenericProductTable />
                </div>
            </div>
        </div>
    );
}
