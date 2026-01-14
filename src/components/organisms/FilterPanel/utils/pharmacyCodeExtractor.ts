// src/components/organisms/FilterPanel/utils/pharmacyCodeExtractor.ts

/**
 * Extracts pharmacy codes from pasted text
 * Accepts codes of any length (typically 7 digits for CIP, but also ID_NAT or numeric IDs)
 * @param text - Raw text containing pharmacy codes
 * @returns Array of unique numeric codes
 */
export const extractPharmacyCodes = (text: string): string[] => {
    const parts = text.split(/[\s,;]+/);
    const codes: string[] = [];

    for (const part of parts) {
        const cleaned = part.replace(/[^0-9]/g, '');
        // Accept any numeric code with at least 1 digit (flexible for CIP, ID, ID_NAT)
        if (cleaned.length >= 1 && !codes.includes(cleaned)) {
            codes.push(cleaned);
        }
    }

    return codes;
};
