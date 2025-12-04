// src/utils/export/excelExporter.ts
import ExcelJS from 'exceljs';

/**
 * Classe utilitaire pour la génération de fichiers Excel
 */
export class ExcelExporter {
    private workbook: ExcelJS.Workbook;

    constructor() {
        this.workbook = new ExcelJS.Workbook();
        this.workbook.creator = 'ApoData';
        this.workbook.created = new Date();
    }

    /**
     * Ajoute une feuille au classeur avec données
     */
    addSheet(
        name: string,
        headers: string[],
        data: any[]
    ): ExcelJS.Worksheet {
        const worksheet = this.workbook.addWorksheet(name);

        // Ajouter les en-têtes
        worksheet.addRow(headers);

        // Formater les en-têtes
        this.formatHeaders(worksheet);

        // Ajouter les données
        data.forEach((row) => {
            const rowData = headers.map((header) => row[header] ?? '');
            worksheet.addRow(rowData);
        });

        // Ajuster la largeur des colonnes
        this.autoSizeColumns(worksheet);

        return worksheet;
    }

    /**
     * Formate les en-têtes (gras, filtres)
     */
    private formatHeaders(worksheet: ExcelJS.Worksheet): void {
        const headerRow = worksheet.getRow(1);

        headerRow.font = {
            bold: true,
            size: 11,
        };

        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        headerRow.alignment = {
            vertical: 'middle',
            horizontal: 'center',
        };

        // Activer les filtres
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: worksheet.columnCount },
        };
    }

    /**
     * Ajuste automatiquement la largeur des colonnes
     */
    private autoSizeColumns(worksheet: ExcelJS.Worksheet): void {
        worksheet.columns.forEach((column) => {
            if (!column.values) return;

            let maxLength = 0;
            column.values.forEach((value) => {
                const length = value ? String(value).length : 0;
                if (length > maxLength) {
                    maxLength = length;
                }
            });

            // Largeur minimale de 10, maximale de 50
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        });
    }

    /**
   * Génère le buffer Excel
   */
    async generateBuffer(): Promise<ArrayBuffer> {
        const buffer = await this.workbook.xlsx.writeBuffer();
        return buffer;
    }

    /**
     * Génère un nom de fichier avec timestamp
     */
    static generateFilename(prefix: string): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
        return `${prefix}_${timestamp}.xlsx`;
    }
}
