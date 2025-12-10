// src/components/molecules/CsvDropZone/CsvDropZone.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';

interface CsvDropZoneProps {
    readonly label: string;
    readonly onFileSelect: (file: File) => Promise<void>;
    readonly isLoading?: boolean;
    readonly error?: string | null;
    readonly productCount?: number;
}

export const CsvDropZone: React.FC<CsvDropZoneProps> = ({
    label,
    onFileSelect,
    isLoading = false,
    error = null,
    productCount
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const csvFile = files.find(f => f.name.endsWith('.csv'));

        if (csvFile) {
            await onFileSelect(csvFile);
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onFileSelect(file);
        }
    }, [onFileSelect]);

    const getStatusIcon = () => {
        if (isLoading) {
            return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />;
        }
        if (error) {
            return <XCircle className="w-8 h-8 text-red-600" />;
        }
        if (productCount !== undefined && productCount > 0) {
            return <CheckCircle className="w-8 h-8 text-green-600" />;
        }
        return <Upload className="w-8 h-8 text-gray-400" />;
    };

    const getStatusText = () => {
        if (isLoading) return 'Chargement...';
        if (error) return error;
        if (productCount !== undefined && productCount > 0) {
            return `✅ ${productCount} produits chargés`;
        }
        return 'Glissez un fichier CSV ou cliquez pour sélectionner';
    };

    return (
        <Card variant="elevated" padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${productCount ? 'border-green-300 bg-green-50' : ''}
        `}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                />

                <div className="flex flex-col items-center space-y-3">
                    {getStatusIcon()}

                    <div>
                        <p className={`text-sm font-medium ${error ? 'text-red-700' : productCount ? 'text-green-700' : 'text-gray-700'}`}>
                            {getStatusText()}
                        </p>
                        {!isLoading && !error && !productCount && (
                            <p className="text-xs text-gray-500 mt-1">
                                Sans en-tête : Colonne 1 = EAN, Colonne 2 = Prix HT
                            </p>
                        )}
                    </div>

                    {productCount !== undefined && productCount > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Fichier prêt pour comparaison</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
