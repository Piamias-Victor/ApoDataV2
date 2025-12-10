// src/app/(dashboard)/hub/page.tsx
'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';
import { LayoutDashboard, LogOut, FileText, User } from 'lucide-react';

import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';

export default function HubPage() {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-gray-50">
            <FilterBar />

            <div className="p-8 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {session?.user?.name || 'Utilisateur'}</h1>
                        <p className="text-gray-600">Votre hub central de gestion</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </Button>
                </div>

                {/* Status Hub */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="gradient" padding="lg">
                        <div className="text-white space-y-2">
                            <div className="flex justify-between items-start">
                                <LayoutDashboard className="w-8 h-8 opacity-80" />
                                <Badge variant="success" size="sm">Connecté</Badge>
                            </div>
                            <div>
                                <p className="text-sm opacity-80">Pharmacie</p>
                                <h3 className="text-xl font-bold">{session?.user?.pharmacyName || 'Ma Pharmacie'}</h3>
                            </div>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="lg">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-900">
                                <FileText className="w-6 h-6 text-blue-500" />
                                <h3 className="font-semibold">Documentation</h3>
                            </div>
                            <p className="text-sm text-gray-600">Accédez aux guides et tutoriels pour maîtriser ApoData.</p>
                            <Button variant="ghost" size="sm" fullWidth>Voir les guides</Button>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="lg">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-900">
                                <User className="w-6 h-6 text-purple-500" />
                                <h3 className="font-semibold">Mon Profil</h3>
                            </div>
                            <p className="text-sm text-gray-600">Gérez vos informations personnelles et préférences.</p>
                            <Button variant="ghost" size="sm" fullWidth>Gérer mon compte</Button>
                        </div>
                    </Card>
                </div>

                {/* Content Placeholder */}
                <Card className="h-64 flex items-center justify-center border-dashed border-2 border-gray-200 bg-gray-50/50">
                    <div className="text-center text-gray-400">
                        <p>Le contenu de votre dashboard apparaîtra ici.</p>
                    </div>
                </Card>

            </div>
        </div>
    );
}
