import React from 'react';
import { KpiCardSkeleton } from './components/KpiCardSkeleton';
import { EvolutionBadge } from './components/EvolutionBadge';

export interface KpiCardProps {
    /** Titre de la KPI (ex: "Achats HT") */
    title: string;
    /** Valeur principale (ex: "125 450 €") */
    primaryValue: string;
    /** Label de la valeur secondaire (ex: "Quantité") - optionnel */
    secondaryLabel?: string | undefined;
    /** Valeur secondaire (ex: "12 345") - optionnel */
    secondaryValue?: string | undefined;
    /** Pourcentage d'évolution (ex: 12.5 pour +12.5%) - optionnel */
    evolutionPercent?: number | undefined;
    /** Libellé optionnel pour l'évolution (ex: "vs N-1") */
    evolutionLabel?: string | undefined;
    /** Pourcentage d'évolution secondaire (ex: pour la valeur secondaire) - optionnel */
    secondaryEvolutionPercent?: number | undefined;
    /** Libellé optionnel pour l'évolution secondaire */
    secondaryEvolutionLabel?: string | undefined;
    /** Icône optionnelle pour la KPI */
    icon?: React.ReactNode | undefined;
    /** Couleur d'accent (correspond aux couleurs de FilterButton) */
    accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | undefined;
    /** État de chargement */
    isLoading?: boolean;
}

const ACCENT_COLORS = {
    blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        glow: 'shadow-blue-200',
    },
    green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        glow: 'shadow-green-200',
    },
    purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        glow: 'shadow-purple-200',
    },
    orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        glow: 'shadow-orange-200',
    },
    red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        glow: 'shadow-red-200',
    },
    indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        glow: 'shadow-indigo-200',
    },
};

/**
 * KPI Card component with glassmorphism design
 * Displays primary value, secondary value, and evolution percentage
 */
export const KpiCard: React.FC<KpiCardProps> = ({
    title,
    primaryValue,
    secondaryLabel,
    secondaryValue,
    evolutionPercent,
    evolutionLabel,
    secondaryEvolutionPercent,
    secondaryEvolutionLabel,
    icon,
    accentColor = 'blue',
    isLoading = false,
}) => {
    const colors = ACCENT_COLORS[accentColor];

    if (isLoading) {
        return <KpiCardSkeleton />;
    }

    return (
        <div className="group relative">
            {/* Glassmorphism Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 h-full">
                {/* Header with Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {title}
                        </h3>
                    </div>
                    {icon && (
                        <div className={`p-2.5 ${colors.bg} ${colors.text} rounded-xl transition-transform group-hover:scale-110`}>
                            {icon}
                        </div>
                    )}
                </div>

                {/* Primary Value */}
                <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                        {primaryValue}
                    </p>
                </div>

                {/* Secondary Value and Evolution */}
                <div className="flex items-center justify-between">
                    {/* Secondary Value - only show if provided */}
                    {secondaryLabel && secondaryValue ? (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                                {secondaryLabel}
                            </p>
                            <p className="text-lg font-bold text-gray-700">
                                {secondaryValue}
                            </p>
                            {/* Secondary Evolution Badge */}
                            <EvolutionBadge
                                evolutionPercent={secondaryEvolutionPercent}
                                label={secondaryEvolutionLabel}
                                isSecondary
                            />
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* Evolution Badge - only show if provided */}
                    <EvolutionBadge
                        evolutionPercent={evolutionPercent}
                        label={evolutionLabel}
                    />
                </div>
            </div>

            {/* Subtle Glow Effect on Hover */}
            <div className={`absolute inset-0 -z-10 ${colors.glow} opacity-0 group-hover:opacity-20 blur-xl rounded-2xl transition-opacity duration-300`} />
        </div>
    );
};
