'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';
import { PharmaciesKpiGrid } from '@/components/organisms/Pharmacies/PharmaciesKpiGrid';
import { CategoryTreeMap } from '@/components/organisms/CategoryAnalysis/CategoryTreeMap';

import { PharmaciesDetailedTable } from '@/components/organisms/Pharmacies/PharmaciesDetailedTable';
import { PharmaciesLaboratoryTable } from '@/components/organisms/Pharmacies/PharmaciesLaboratoryTable';
import { PharmaciesProductTable } from '@/components/organisms/Pharmacies/PharmaciesProductTable';
import { PharmaciesGeoAnalysis } from '@/components/organisms/Pharmacies/PharmaciesGeoAnalysis';
import { SimulationDashboard } from '@/components/organisms/Simulation/SimulationDashboard';
import { PreorderEvolutionChart } from '@/components/organisms/PreorderAnalysis/PreorderEvolutionChart';

export default function PharmaciesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-[68px]">
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
            <div className="relative z-10 pt-8 px-8 pb-8">
                <div className="max-w-7xl mx-auto space-y-8 pt-6">
                    {/* Page Header */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-cyan-600" />
                            Pharmacies
                        </h1>
                        <p className="text-gray-600">
                            Analyse détaillée et comparative de votre réseau de pharmacies.
                        </p>
                    </div>

                    {/* KPI Grid */}
                    <PharmaciesKpiGrid />

                    {/* Tree Map Analysis */}
                    <CategoryTreeMap />

                    {/* Map Analysis */}
                    <div className="mt-8 space-y-8">
                        {/* Regional Map */}
                        <PharmaciesGeoAnalysis />



                        {/* Main Analysis Tables */}
                        <PharmaciesDetailedTable />

                        {/* Laboratory Analysis Table */}
                        <PharmaciesLaboratoryTable />
                    </div>

                    {/* Product Analysis Table */}
                    <PharmaciesProductTable />

                    {/* Simulation */}
                    <SimulationDashboard />

                    {/* Pre-order Temporal Evolution */}
                    <PreorderEvolutionChart />
                </div>
            </div>
        </div>
    );
}
