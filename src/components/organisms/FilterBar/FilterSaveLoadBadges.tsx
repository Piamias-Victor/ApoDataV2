import React, { useState } from 'react';
import { Save, FolderOpen, Eye, EyeOff } from 'lucide-react';
import { SaveFilterModal } from '@/components/molecules/Modal/SaveFilterModal';
import { LoadFilterModal } from '@/components/molecules/Modal/LoadFilterModal';

interface FilterSaveLoadBadgesProps {
    presentationMode: boolean;
    onTogglePresentationMode: () => void;
}

export const FilterSaveLoadBadges: React.FC<FilterSaveLoadBadgesProps> = ({ 
    presentationMode, 
    onTogglePresentationMode 
}) => {
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);

    return (
        <>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                {/* Save Badge */}
                <button
                    onClick={() => setShowSaveModal(true)}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-green-200/50 hover:border-green-300 text-green-700 hover:text-green-800 text-xs font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:bg-white/90"
                    title="Sauvegarder les filtres actuels"
                >
                    <Save className="w-3 h-3" />
                    <span>Sauvegarder</span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Load Badge */}
                <button
                    onClick={() => setShowLoadModal(true)}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-blue-200/50 hover:border-blue-300 text-blue-700 hover:text-blue-800 text-xs font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:bg-white/90"
                    title="Charger une configuration"
                >
                    <FolderOpen className="w-3 h-3" />
                    <span>Charger</span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Presentation Mode Badge */}
                <button
                    onClick={onTogglePresentationMode}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md border text-xs font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:bg-white/90 ${
                        presentationMode 
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800' 
                        : 'bg-white/80 border-indigo-200/50 hover:border-indigo-300 text-indigo-700 hover:text-indigo-800'
                    }`}
                    title={presentationMode ? "Masquer le résumé" : "Afficher le résumé (pour capture)"}
                >
                    {presentationMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{presentationMode ? 'Masquer' : 'Aperçu'}</span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            {/* Modals */}
            {showSaveModal && <SaveFilterModal onClose={() => setShowSaveModal(false)} />}
            {showLoadModal && <LoadFilterModal onClose={() => setShowLoadModal(false)} />}
        </>
    );
};
