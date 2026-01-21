import { useState } from 'react';

type ColumnType = 'text' | 'number' | 'currency' | 'percentage' | 'date';

interface CSVColumn {
    key: string;
    label: string;
    type: ColumnType;
}

interface ExportOptions {
    data: any[];
    columns: CSVColumn[];
    filename: string;
}

/**
 * Hook pour exporter des données en CSV avec formatage français
 * - Virgules au lieu de points pour les décimales
 * - Pourcentages en décimales (25% → 0,25)
 * - Séparateur point-virgule
 * - Encodage UTF-8 avec BOM
 */
export const useCSVExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const formatValue = (value: any, type: ColumnType): string => {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        switch (type) {
            case 'percentage':
                // Convertir pourcentage en décimal avec virgule
                // 25.5 → 0,255
                const decimal = typeof value === 'number' ? value / 100 : parseFloat(value) / 100;
                return decimal.toString().replace('.', ',');

            case 'number':
            case 'currency':
                // Remplacer point par virgule pour les décimales
                // 1234.56 → 1234,56
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                if (isNaN(numValue)) return value.toString();
                return numValue.toString().replace('.', ',');

            case 'date':
                // Format DD/MM/YYYY
                if (value instanceof Date) {
                    const day = value.getDate().toString().padStart(2, '0');
                    const month = (value.getMonth() + 1).toString().padStart(2, '0');
                    const year = value.getFullYear();
                    return `${day}/${month}/${year}`;
                }
                return value.toString();

            case 'text':
            default:
                // Échapper les guillemets et entourer de guillemets si contient point-virgule
                const strValue = value.toString();
                if (strValue.includes(';') || strValue.includes('"') || strValue.includes('\n')) {
                    return `"${strValue.replace(/"/g, '""')}"`;
                }
                return strValue;
        }
    };

    const exportToCSV = ({ data, columns, filename }: ExportOptions) => {
        setIsExporting(true);

        try {
            // Créer l'en-tête
            const header = columns.map(col => col.label).join(';');

            // Créer les lignes de données
            const rows = data.map(row => {
                return columns.map(col => {
                    const value = row[col.key];
                    return formatValue(value, col.type);
                }).join(';');
            });

            // Combiner header et rows
            const csvContent = [header, ...rows].join('\n');

            // Ajouter BOM UTF-8 pour Excel
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

            // Créer le lien de téléchargement
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors de l\'export CSV:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return { exportToCSV, isExporting };
};
