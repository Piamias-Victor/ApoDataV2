// src/utils/export/csvExporter.ts

/**
 * Utilitaire d'export CSV avec format français
 * Gère l'encodage UTF-8 BOM pour Excel français
 */

export interface CsvExportOptions {
  readonly filename: string;
  readonly headers: string[];
  readonly data: any[];
  readonly separator?: string;
  readonly addBOM?: boolean;
}

export class CsvExporter {
  private static readonly BOM = '\ufeff';
  private static readonly DEFAULT_SEPARATOR = ';';
  
  /**
   * Formate une valeur pour CSV français
   */
  private static formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Dates au format DD/MM/YYYY
    if (value instanceof Date) {
      const day = value.getDate().toString().padStart(2, '0');
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Nombres avec virgule décimale
    if (typeof value === 'number') {
      return value.toString().replace('.', ',');
    }
    
    // Chaînes avec échappement des guillemets
    const str = String(value);
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }
  
  /**
   * Génère le contenu CSV
   */
  private static generateCsvContent(
    headers: string[],
    data: any[],
    separator: string
  ): string {
    const lines: string[] = [];
    
    // En-têtes
    lines.push(headers.map(h => this.formatValue(h)).join(separator));
    
    // Données
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatValue(value);
      });
      lines.push(values.join(separator));
    }
    
    return lines.join('\r\n');
  }
  
  /**
   * Déclenche le téléchargement du fichier CSV
   */
  public static export({
    filename,
    headers,
    data,
    separator = this.DEFAULT_SEPARATOR,
    addBOM = true
  }: CsvExportOptions): void {
    // Génération du contenu
    const csvContent = this.generateCsvContent(headers, data, separator);
    
    // Ajout du BOM pour Excel français
    const finalContent = addBOM ? this.BOM + csvContent : csvContent;
    
    // Création du blob
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8' });
    
    // Création du lien de téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Déclenchement du téléchargement
    document.body.appendChild(link);
    link.click();
    
    // Nettoyage
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Génère un nom de fichier avec date
   */
  public static generateFilename(prefix: string, extension: string = 'csv'): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    return `${prefix}_${date}.${extension}`;
  }
}