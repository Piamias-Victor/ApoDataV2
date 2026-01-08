'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Package,
    Tag,
    PieChart,
    Building2,
    BarChart2,
    ArrowRight,
    ShieldCheck,
    Handshake
} from 'lucide-react';

const HUB_MODULES = [
    {
        title: 'Dashboard',
        description: 'Vue d\'ensemble, rapport global et comparaison avec la moyenne du groupement.',
        icon: LayoutDashboard,
        href: '/dashboard',
        gradient: 'from-blue-500 to-blue-600',
        lightGradient: 'from-blue-50 to-blue-100/50',
        textColor: 'text-blue-600',
        borderColor: 'group-hover:border-blue-200'
    },
    {
        title: 'Achat / Vente',
        description: 'Analyse détaillée du découpage de vos ventes, par catégories et laboratoires.',
        icon: ArrowRightLeft,
        href: '/achats-ventes',
        gradient: 'from-emerald-500 to-teal-600',
        lightGradient: 'from-emerald-50 to-teal-100/50',
        textColor: 'text-emerald-600',
        borderColor: 'group-hover:border-emerald-200'
    },
    {
        title: 'Stock / Rupture',
        description: 'Analyse des ruptures, prévention des stocks dormants et analyse des surstocks.',
        icon: Package,
        href: '/stock-rupture',
        gradient: 'from-red-500 to-rose-600',
        lightGradient: 'from-red-50 to-rose-100/50',
        textColor: 'text-red-600',
        borderColor: 'group-hover:border-red-200'
    },
    {
        title: 'Prix',
        description: 'Revoyez votre positionnement prix et optimisez vos marges.',
        icon: Tag,
        href: '/prix',
        gradient: 'from-orange-500 to-amber-600',
        lightGradient: 'from-orange-50 to-amber-100/50',
        textColor: 'text-orange-600',
        borderColor: 'group-hover:border-orange-200'
    },
    {
        title: 'Analyse Générique',
        description: 'Analyse détaillée sur les génériques, les couvertures et les remises.',
        icon: PieChart,
        href: '/analyse-generique',
        gradient: 'from-pink-500 to-fuchsia-600',
        lightGradient: 'from-pink-50 to-fuchsia-100/50',
        textColor: 'text-pink-600',
        borderColor: 'group-hover:border-pink-200'
    },
    {
        title: 'Pharmacies',
        description: 'Analyser l\'ensemble des pharmacies du groupement.',
        icon: Building2,
        href: '/pharmacies',
        gradient: 'from-cyan-500 to-sky-600',
        lightGradient: 'from-cyan-50 to-sky-100/50',
        textColor: 'text-cyan-600',
        borderColor: 'group-hover:border-cyan-200'
    },
    {
        title: 'Négociation',
        description: 'Suivi et gestion de vos négociations commerciales.',
        icon: Handshake,
        href: '/negociation',
        gradient: 'from-yellow-500 to-amber-600',
        lightGradient: 'from-yellow-50 to-amber-100/50',
        textColor: 'text-yellow-600',
        borderColor: 'group-hover:border-yellow-200'
    },
    {
        title: 'Comparaison',
        description: 'Comparer plusieurs éléments entre eux pour analyser les performances.',
        icon: BarChart2,
        href: '/comparaison',
        gradient: 'from-violet-500 to-purple-600',
        lightGradient: 'from-violet-50 to-purple-100/50',
        textColor: 'text-violet-600',
        borderColor: 'group-hover:border-violet-200'
    }
];

export default function HubPage() {
    const { data: session } = useSession();
    const firstName = session?.user?.name?.split(' ')[0] || 'Utilisateur';

    const visibleModules = [...HUB_MODULES];
    if (session?.user?.role === 'admin') {
        visibleModules.push({
            title: "Admin",
            description: "Gestion des utilisateurs et des pharmacies.",
            icon: ShieldCheck,
            href: "/admin",
            gradient: "from-red-500 to-red-600",
            lightGradient: "from-red-50 to-red-100/50",
            textColor: "text-red-600",
            borderColor: "group-hover:border-red-200"
        });
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* New Design Header */}
            <div className="relative bg-white pt-10 pb-20 px-8 rounded-b-[3rem] shadow-sm border-b border-gray-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

                <div className="relative max-w-[1400px] mx-auto flex flex-col items-center text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                            Bonjour, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">{firstName}</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Accédez à vos outils d&apos;analyse et pilotez la performance de vos officines en un coup d&apos;œil.
                        </p>
                    </div>

                    <div className="w-full pointer-events-auto flex justify-center transform translate-y-2">
                        <FilterBar />
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <main className="max-w-[1400px] mx-auto px-12 -mt-5 relative z-10 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleModules.map((module) => (
                        <Link
                            key={module.title}
                            href={module.href}
                            className={`
                                group relative flex flex-col p-8 rounded-[2rem]
                                bg-white border border-gray-100/80
                                bg-gradient-to-br ${module.lightGradient}
                                shadow-xl shadow-gray-200/40
                                transition-all duration-300 ease-out
                                hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/5
                                ${module.borderColor} hover:border-transparent
                            `}
                        >
                            {/* Icon Container */}
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center mb-6
                                bg-gradient-to-br ${module.gradient}
                                shadow-lg shadow-gray-200
                                transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                            `}>
                                <module.icon className="w-7 h-7 text-white" strokeWidth={2} />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <h3 className={`text-xl font-bold mb-3 ${module.textColor} tracking-tight`}>
                                    {module.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-[15px] font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                    {module.description}
                                </p>
                            </div>

                            {/* Action Arrow */}
                            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">
                                <span>Explorer</span>
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative Shine Effect */}
                            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
