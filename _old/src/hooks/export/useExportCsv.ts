// src/hooks/export/useExportCsv.ts

import { useState, useCallback } from 'react';
import { CsvExporter, type CsvExportOptions } from '@/utils/export/csvExporter';

interface UseExportCsvOptions {
  readonly onSuccess?: () => void;
  readonly onError?: (error: Error) => void;
}

export function useExportCsv(options?: UseExportCsvOptions) {
  const [isExporting, setIsExporting] = useState(false);
  
  const exportToCsv = useCallback(async (exportOptions: CsvExportOptions) => {
    setIsExporting(true);
    
    try {
      // Export avec délai pour UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      CsvExporter.export(exportOptions);
      
      // Toast notification simple (à remplacer par votre système de notification)
      console.log(`✅ Export CSV réussi : ${exportOptions.filename}`);
      
      options?.onSuccess?.();
    } catch (error) {
      console.error('Erreur export CSV:', error);
      options?.onError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  }, [options]);
  
  return {
    exportToCsv,
    isExporting
  };
}