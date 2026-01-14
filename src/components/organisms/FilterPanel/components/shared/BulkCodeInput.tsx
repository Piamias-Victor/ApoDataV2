import React from 'react';
import { extractProductCodes } from '../../utils/codeExtractor';

interface BulkCodeInputProps {
    onCodesExtracted: (codes: string[]) => Promise<void>;
    buttonColor?: 'green' | 'gray' | 'orange';
    codeExtractor?: (text: string) => string[];
}

export const BulkCodeInput: React.FC<BulkCodeInputProps> = ({
    onCodesExtracted,
    buttonColor = 'green',
    codeExtractor = extractProductCodes
}) => {
    const [bulkCodes, setBulkCodes] = React.useState('');
    const [showInput, setShowInput] = React.useState(false);

    const extractedCodes = codeExtractor(bulkCodes);

    const handleSubmit = async () => {
        if (extractedCodes.length > 0) {
            await onCodesExtracted(extractedCodes);
            setBulkCodes('');
            setShowInput(false);
        }
    };

    const colors = {
        green: {
            gradient: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
            text: 'text-green-600 hover:text-green-700',
            ring: 'focus:ring-green-500'
        },
        gray: {
            gradient: 'from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black',
            text: 'text-gray-700 hover:text-gray-900',
            ring: 'focus:ring-gray-500'
        },
        orange: {
            gradient: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
            text: 'text-orange-600 hover:text-orange-700',
            ring: 'focus:ring-orange-500'
        }
    };

    const theme = colors[buttonColor];

    return (
        <>
            <button
                onClick={() => setShowInput(!showInput)}
                className={`text-xs font-semibold ${theme.text} transition-colors`}
            >
                {showInput ? '− Masquer' : '+ Coller plusieurs codes'}
            </button>

            {showInput && (
                <div className="space-y-2">
                    <textarea
                        value={bulkCodes}
                        onChange={(e) => setBulkCodes(e.target.value)}
                        placeholder="Collez vos codes ici"
                        className={`w-full h-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent resize-none`}
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            {extractedCodes.length} code(s) détecté(s)
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={extractedCodes.length === 0}
                            className={`px-4 py-2 bg-gradient-to-r ${theme.gradient} text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                        >
                            Rechercher {extractedCodes.length > 0 && `(${extractedCodes.length})`}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
