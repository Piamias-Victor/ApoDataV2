// src/components/organisms/FilterPanel/utils/codeExtractor.ts

/**
 * Extracts 13-character product codes from pasted text
 * @param text - Raw text containing product codes
 * @returns Array of unique 13-digit codes
 */
export const extractProductCodes = (text: string): string[] => {
    const parts = text.split(/[\s,;]+/);
    const codes: string[] = [];

    for (const part of parts) {
        const cleaned = part.replace(/[^0-9]/g, '');
        if (cleaned.length === 13 && !codes.includes(cleaned)) {
            codes.push(cleaned);
        }
    }

    return codes;
};
