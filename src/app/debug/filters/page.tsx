// src/app/debug/filters/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { resolveProductCodes } from '@/services/FilterResolutionService';

export default function DebugFiltersPage() {
    const store = useFilterStore();
    const [resolvedCodes, setResolvedCodes] = useState<string[]>([]);

    useEffect(() => {
        const codes = resolveProductCodes(store);
        setResolvedCodes(codes);
    }, [store]); // Recalculate on any store change



    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold">🛠️ Debug Filtres V3</h1>

            <div className="grid grid-cols-2 gap-8">
                {/* STATE VIEWER */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">État du Store (Zustand)</h2>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto h-96">
                        {JSON.stringify(store, (_key, value) => {
                            // Clean up function display for JSON
                            if (typeof value === 'function') return undefined;
                            return value;
                        }, 2)}
                    </pre>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-green-600">Résultat Calculé (Service)</h2>
                    <div className="mb-2 font-medium">Nombre de codes: {resolvedCodes.length}</div>
                    <div className="flex flex-wrap gap-2">
                        {resolvedCodes.length > 0 ? (
                            resolvedCodes.map(code => (
                                <span key={code} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-mono">
                                    {code}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400 italic">Aucun filtre actif = Tous (mocké vide)</span>
                        )}
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Filter Operators: {JSON.stringify(store.filterOperators)}
                    </div>
                </div>
            </div>
        </div>
    );
}
