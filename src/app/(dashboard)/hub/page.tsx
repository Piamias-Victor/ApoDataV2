
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Package,
    Tag,
    Building2,
    BarChart2,
    Calculator,
    FileText,
    LogOut,
    ShieldCheck,
    User
} from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';

// Hub Navigation Items Configuration
const HUB_ITEMS = [
    {
        title: 'Dashboard',
        description: 'Vue d\'ensemble de vos performances et indicateurs clés.',
        icon: <LayoutDashboard />,
        href: '/dashboard',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        hoverBg: 'group-hover:bg-blue-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-blue-500'
    },
    {
        title: 'Achat / Vente',
        description: 'Analysez vos flux d\'achats et de ventes en détail.',
        icon: <ArrowRightLeft />,
        href: '/achats-ventes',
        color: 'text-green-600',
        bg: 'bg-green-50',
        hoverBg: 'group-hover:bg-green-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-green-500'
    },
    {
        title: 'Stock / Rupture',
        description: 'Suivi des stocks et gestion des ruptures produits.',
        icon: <Package />,
        href: '/stock',
        color: 'text-red-600',
        bg: 'bg-red-50',
        hoverBg: 'group-hover:bg-red-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-red-500'
    },
    {
        title: 'Prix',
        description: 'Gestion et optimisation de votre stratégie tarifaire.',
        icon: <Tag />,
        href: '/prix',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        hoverBg: 'group-hover:bg-orange-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-orange-500'
    },
    {
        title: 'Pharmacies',
        description: 'Liste et détails de toutes les pharmacies du réseau.',
        icon: <Building2 />,
        href: '/pharmacies',
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        hoverBg: 'group-hover:bg-cyan-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-cyan-500'
    },
    {
        title: 'Comparaison',
        description: 'Comparez les performances entre différentes périodes ou entités.',
        icon: <BarChart2 />,
        href: '/comparaison',
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        hoverBg: 'group-hover:bg-pink-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-pink-500'
    },
    {
        title: 'Simulation',
        description: 'Simulez l\'impact de changements de prix ou de remises.',
        icon: <Calculator />,
        href: '/simulation',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        hoverBg: 'group-hover:bg-yellow-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-yellow-500'
    },
    {
        title: 'BRI',
        description: 'Accédez aux documents et rapports d\'intelligence d\'affaires.',
        icon: <FileText />,
        href: '/bri',
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        hoverBg: 'group-hover:bg-gray-600',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-gray-500'
    },
    {
        title: 'Admin',
        description: 'Paramètres globaux et administration du système.',
        icon: <ShieldCheck />,
        href: '/admin',
        color: 'text-red-700',
        bg: 'bg-red-50',
        hoverBg: 'group-hover:bg-red-700',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-red-600'
    },
    {
        title: 'Mon Compte',
        description: 'Votre profil utilisateur et préférences personnelles.',
        icon: <User />,
        href: '/account',
        color: 'text-blue-800',
        bg: 'bg-blue-50',
        hoverBg: 'group-hover:bg-blue-800',
        hoverText: 'group-hover:text-white',
        border: 'group-hover:border-blue-700'
    }
];

export default function HubPage() {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 ml-[68px]"> {/* Added margin-left for SideBar */}

            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Hub Central
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Bienvenue, <span className="font-semibold text-gray-800">{session?.user?.name || 'Utilisateur'}</span>. Accédez à tous vos outils en un clic.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="bg-white hover:bg-red-50 hover:text-red-600 text-gray-600 border-gray-200"
                        iconLeft={<LogOut className="w-4 h-4" />}
                    >
                        Déconnexion
                    </Button>
                </div>

                {/* Grid Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {HUB_ITEMS.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={`
                                group relative p-6 rounded-3xl 
                                bg-white/70 backdrop-blur-md 
                                border border-white/60 shadow-lg hover:shadow-2xl 
                                transition-all duration-300 ease-out hover:-translate-y-1
                                ${item.border} hover:border-opacity-50
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`
                                    p-3 rounded-2xl transition-colors duration-300
                                    ${item.bg} ${item.color}
                                    ${item.hoverBg} ${item.hoverText}
                                `}>
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 28 })}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-400">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                {item.description}
                            </p>

                            {/* Decorative background glow */}
                            <div className={`
                                absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl
                                ${item.bg.replace('bg-', 'bg-gradient-to-br from-').replace('50', '400')} to-transparent -z-10
                            `} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
