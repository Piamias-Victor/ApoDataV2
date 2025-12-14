
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 border border-blue-100">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-gray-500">Chargement...</p>
            </div>
        </div>
    );
}
