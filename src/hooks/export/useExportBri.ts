// src/hooks/export/useExportBri.ts
'use client';

import { useState, useCallback } from 'react';
import type { BriExportFilters } from '@/types/declaration-bri';

interface UseExportBriReturn {
    readonly exportBri: (filters: BriExportFilters) => Promise<void>;
    readonly isExporting: boolean;
    readonly error: string | null;
}

/**
 * Hook pour gérer l'export BRI
 */
export function useExportBri(): UseExportBriReturn {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportBri = useCallback(async (filters: BriExportFilters) => {
        setIsExporting(true);
        setError(null);

        try {
            console.log('📊 [useExportBri] Starting export with filters:', filters);

            const response = await fetch('/api/declaration-bri/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            // Récupérer le blob
            const blob = await response.blob();

            // Extraire le nom de fichier depuis les headers
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'declaration_bri.xlsx';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Nettoyer
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log('✅ [useExportBri] Export successful:', filename);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            console.error('❌ [useExportBri] Export error:', errorMessage);
            setError(errorMessage);
            throw err;
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        exportBri,
        isExporting,
        error,
    };
}
