// src/components/organisms/FilterPanel/components/shared/BulkCodeInput.tsx
import React from 'react';
import { extractProductCodes } from '../../utils/codeExtractor';

interface BulkCodeInputProps {
    onCodesExtracted: (codes: string[]) => Promise<void>;
    buttonColor?: 'green' | 'gray';
}

export const BulkCodeInput: React.FC<BulkCodeInputProps> = ({
    onCodesExtracted,
    buttonColor = 'green'
}) => {
    const [bulkCodes, setBulkCodes] = React.useState('');
    const [showInput, setShowInput] = React.useState(false);

    const extractedCodes = extractProductCodes(bulkCodes);

    const handleSubmit = async () => {
        if (extractedCodes.length > 0) {
            await onCodesExtracted(extractedCodes);
            setBulkCodes('');
            setShowInput(false);
        }
    };

    const buttonGradient = buttonColor === 'gray'
        ? 'from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black'
        : 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600';

    const toggleColor = buttonColor === 'gray'
        ? 'text-gray-700 hover:text-gray-900'
        : 'text-green-600 hover:text-green-700';

    return (
        <>
            <button
                onClick={() => setShowInput(!showInput)}
                className={`text-xs font-semibold ${toggleColor} transition-colors`}
            >
                {showInput ? '− Masquer' : '+ Coller plusieurs codes'}
            </button>

            {showInput && (
                <div className="space-y-2">
                    <textarea
                        value={bulkCodes}
                        onChange={(e) => setBulkCodes(e.target.value)}
                        placeholder="Collez vos codes ici (13 caractères chacun)&#10;Exemple:&#10;3400937910194&#10;3400936012345&#10;..."
                        className={`w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-${buttonColor === 'gray' ? 'gray' : 'green'}-500 focus:border-transparent resize-none`}
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            {extractedCodes.length} code(s) détecté(s)
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={extractedCodes.length === 0}
                            className={`px-4 py-2 bg-gradient-to-r ${buttonGradient} text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                        >
                            Rechercher {extractedCodes.length > 0 && `(${extractedCodes.length})`}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
