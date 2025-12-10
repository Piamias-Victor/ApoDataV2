// src/components/organisms/FeaturesSection/data/features.ts
import {
    ShoppingCart,
    TrendingUp,
    Package,
    DollarSign,
    BarChart3,
    Handshake,
    Settings,
    Target,
    Download
} from 'lucide-react';

export interface Feature {
    title: string;
    description: string;
    icon: any;
    gradient: string;
}

export const features: Feature[] = [
    {
        title: "Maîtrisez vos ventes",
        description: "Analysez votre sell-out en temps réel avec des insights précis sur vos performances commerciales",
        icon: ShoppingCart,
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        title: "Optimisez vos achats",
        description: "Suivez votre sell-in et négociez mieux avec vos laboratoires grâce aux données consolidées",
        icon: TrendingUp,
        gradient: "from-green-500 to-emerald-500"
    },
    {
        title: "Gérez votre stock",
        description: "Analysez votre inventaire, évitez les ruptures et optimisez votre rotation de stock intelligemment",
        icon: Package,
        gradient: "from-purple-500 to-violet-500"
    },
    {
        title: "Maximisez vos marges",
        description: "Analysez la rentabilité produit par produit et comparez vos fournisseurs pour optimiser vos profits",
        icon: DollarSign,
        gradient: "from-orange-500 to-red-500"
    },
    {
        title: "Comparez-vous aux autres",
        description: "Benchmarkez vos performances avec des acteurs similaires et identifiez vos avantages compétitifs",
        icon: BarChart3,
        gradient: "from-indigo-500 to-blue-500"
    },
    {
        title: "Renforcez votre négociation",
        description: "Utilisez des benchmarks prix détaillés pour négocier de meilleures conditions avec vos laboratoires",
        icon: Handshake,
        gradient: "from-pink-500 to-rose-500"
    },
    {
        title: "Optimisez votre stock",
        description: "Améliorez votre rotation de stock et réduisez vos immobilisations pour une gestion efficace",
        icon: Settings,
        gradient: "from-teal-500 to-green-500"
    },
    {
        title: "Optimisez vos prix",
        description: "Comparez vos tarifs et définissez votre positionnement prix pour maximiser vos revenus",
        icon: Target,
        gradient: "from-yellow-500 to-orange-500"
    },
    {
        title: "Exportez vos données",
        description: "Exportez facilement vos analyses et rapports dans vos formats préférés pour votre équipe",
        icon: Download,
        gradient: "from-slate-500 to-gray-500"
    }
];
