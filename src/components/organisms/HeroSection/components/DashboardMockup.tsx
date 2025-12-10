// src/components/organisms/HeroSection/components/DashboardMockup.tsx
'use client';

import React from 'react';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';
import { CheckCircle } from 'lucide-react';

export const DashboardMockup: React.FC = () => {
    return (
        <Card variant="glass" padding="lg">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Dashboard ApoData</h3>
                    </div>
                    <Badge variant="success" size="sm" iconLeft={<CheckCircle className="w-3 h-3" />}>
                        En ligne
                    </Badge>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="elevated" padding="md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">CA Sell-Out</h4>
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-gray-900">245 850 €</div>
                                <div className="flex items-center text-sm">
                                    <span className="text-green-600 font-medium">+12.5%</span>
                                    <span className="text-gray-500 ml-1">ce mois</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">CA Sell-In</h4>
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-gray-900">189 420 €</div>
                                <div className="flex items-center text-sm">
                                    <span className="text-orange-600 font-medium">-2.1%</span>
                                    <span className="text-gray-500 ml-1">ce mois</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Stock Valorisé</h4>
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-gray-900">89 640 €</div>
                                <div className="flex items-center text-sm">
                                    <span className="text-green-600 font-medium">+8.3%</span>
                                    <span className="text-gray-500 ml-1">optimal</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Info Bar */}
                <div className="flex items-center justify-center pt-4 border-t border-gray-200/50">
                    <p className="text-sm text-gray-500">
                        Données en temps réel • Mise à jour automatique • Interface zero formation
                    </p>
                </div>

            </div>
        </Card>
    );
};
