'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, ArrowLeft } from 'lucide-react';
import { AdminPharmaciesTable } from '@/components/organisms/Admin/AdminPharmaciesTable';
import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';
import { RegisterUserModal } from '@/components/organisms/Admin/RegisterUserModal';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const firstName = session?.user?.name?.split(' ')[0] || 'Utilisateur';

    // Protection logic
    React.useEffect(() => {
        if (status === 'loading') return;
        if (!session || session.user.role !== 'admin') {
            router.push('/hub');
        }
    }, [session, status, router]);

    if (status === 'loading' || !session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header Section like Hub */}
            <div className="relative bg-white pt-10 pb-20 px-8 rounded-b-[3rem] shadow-sm border-b border-gray-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-transparent pointer-events-none" />

                {/* Back Button - Absolute Positioned */}
                <div className="absolute top-8 left-8 z-20">
                    <Link
                        href="/hub"
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 rounded-xl transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm">Revenir au HUB</span>
                    </Link>
                </div>

                <div className="relative max-w-[1400px] mx-auto flex flex-col items-center text-center space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-red-50 rounded-2xl mb-2">
                            <ShieldCheck className="w-8 h-8 text-red-600" strokeWidth={2} />
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                            Bonjour, <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">{firstName}</span>
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

            <main className="max-w-[1400px] mx-auto px-12 -mt-5 relative z-10 pb-20 space-y-8">
                {/* Action Bar */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Liste des Pharmacies
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Admin</span>
                    </h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-2xl transition-all shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 font-semibold text-sm tracking-wide"
                    >
                        <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                        <span>Nouvel Utilisateur</span>
                    </button>
                </div>

                {/* Pharmacies Management */}
                <AdminPharmaciesTable />
            </main>

            {/* Modals */}
            {isModalOpen && (
                <RegisterUserModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        // Optional: trigger table refresh if needed
                    }}
                />
            )}
        </div>
    );
}
