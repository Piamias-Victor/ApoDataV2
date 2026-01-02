
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Network,
    ArrowRightLeft,
    Tag,
    Package,
    Building2,
    PieChart,
    BarChart2,
} from 'lucide-react';

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    color: string;
    isActive: boolean;
    isExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, color, isActive, isExpanded }) => {

    const getColorClasses = (c: string) => {
        switch (c) {
            case 'purple': return { active: 'bg-purple-50 text-purple-700', icon: 'text-purple-600', hover: 'hover:bg-purple-50 hover:text-purple-600' };
            case 'blue': return { active: 'bg-blue-50 text-blue-700', icon: 'text-blue-600', hover: 'hover:bg-blue-50 hover:text-blue-600' };
            case 'green': return { active: 'bg-green-50 text-green-700', icon: 'text-green-600', hover: 'hover:bg-green-50 hover:text-green-600' };
            case 'red': return { active: 'bg-red-50 text-red-700', icon: 'text-red-600', hover: 'hover:bg-red-50 hover:text-red-600' };
            case 'orange': return { active: 'bg-orange-50 text-orange-700', icon: 'text-orange-600', hover: 'hover:bg-orange-50 hover:text-orange-600' };
            case 'cyan': return { active: 'bg-cyan-50 text-cyan-700', icon: 'text-cyan-600', hover: 'hover:bg-cyan-50 hover:text-cyan-600' };
            case 'pink': return { active: 'bg-pink-50 text-pink-700', icon: 'text-pink-600', hover: 'hover:bg-pink-50 hover:text-pink-600' };
            case 'yellow': return { active: 'bg-yellow-50 text-yellow-700', icon: 'text-yellow-600', hover: 'hover:bg-yellow-50 hover:text-yellow-600' };
            case 'gray': return { active: 'bg-gray-100 text-gray-700', icon: 'text-gray-600', hover: 'hover:bg-gray-100 hover:text-gray-600' };
            default: return { active: 'bg-blue-50 text-blue-700', icon: 'text-blue-600', hover: 'hover:bg-blue-50 hover:text-blue-600' };
        }
    };

    const styles = getColorClasses(color);
    const baseClasses = "group flex items-center px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden";
    const activeClasses = isActive ? `${styles.active} shadow-sm font-semibold` : `text-gray-500 ${styles.hover}`;

    return (
        <Link
            href={href}
            className={`${baseClasses} ${activeClasses} ${isExpanded ? 'gap-4' : 'gap-0 justify-center'}`}
        >
            <div className={`
                flex items-center justify-center transition-all duration-300
                ${isActive ? styles.icon : 'text-gray-400 group-hover:text-gray-600'}
            `}>
                <span className="transform transition-transform duration-300 group-hover:scale-110">
                    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                </span>
            </div>

            <span className={`
                whitespace-nowrap transition-all duration-300 origin-left text-[15px]
                ${isExpanded ? 'opacity-100 w-auto translate-x-0' : 'opacity-0 w-0 -translate-x-4 absolute left-14'}
            `}>
                {label}
            </span>
        </Link>
    );
};

export const SideNavBar: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const pathname = usePathname();

    if (pathname === '/' || pathname === '/login') return null;

    const menuItems = [
        { label: 'Hub', icon: <Network />, href: '/hub', color: 'purple' },
        { label: 'Dashboard', icon: <LayoutDashboard />, href: '/dashboard', color: 'blue' },
        { label: 'Achat / Vente', icon: <ArrowRightLeft />, href: '/achats-ventes', color: 'green' },
        { label: 'Analyse Générique', icon: <PieChart />, href: '/analyse-generique', color: 'pink' },
        { label: 'Prix', icon: <Tag />, href: '/prix', color: 'orange' },
        { label: 'Stock / Rupture', icon: <Package />, href: '/stock-rupture', color: 'red' },
        { label: 'Pharmacies', icon: <Building2 />, href: '/pharmacies', color: 'cyan' },
        { label: 'Comparaison', icon: <BarChart2 />, href: '/comparaison', color: 'pink' },
        // { label: 'Simulation', icon: <Calculator />, href: '/simulation', color: 'yellow' },
        // { label: 'BRI', icon: <FileText />, href: '/bri', color: 'gray' },
        // { label: 'Admin', icon: <ShieldCheck />, href: '/admin', color: 'red' },
        // { label: 'Mon compte', icon: <User />, href: '/account', color: 'blue' },
    ];

    return (
        <div
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-start"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className={`
                bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 ring-1 ring-black/5
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                flex flex-col gap-1.5 p-2
                ${isExpanded ? 'w-64' : 'w-[68px]'}
            `}>
                {menuItems.map((item) => (
                    <NavItem
                        key={item.label}
                        {...item}
                        isActive={pathname === item.href}
                        isExpanded={isExpanded}
                    />
                ))}
            </div>
        </div>
    );
};
