// src/components/organisms/HeroSection/HeroSection.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Shield, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { DashboardMockup } from './components/DashboardMockup';

export const HeroSection: React.FC = () => {
    return (
        <section className="py-20 px-4">
            <div className="container-apodata">
                <div className="text-center max-w-4xl mx-auto">

                    {/* Tagline */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-6"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Reprenez la main
                            </span>
                            <br />
                            <span className="text-gray-900">sur vos données</span>
                        </h1>
                    </motion.div>

                    {/* Sous-titre */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
                    >
                        Maîtrisez vos données pharmaceutiques avec une simplicité inégalée.
                        Performance, analyse et contrôle total, tout en interne.
                    </motion.p>

                    {/* Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-4 mb-10"
                    >
                        <Badge variant="gradient-blue" size="md" iconLeft={<Shield className="w-4 h-4" />}>
                            Sécurité
                        </Badge>
                        <Badge variant="gradient-green" size="md" iconLeft={<CheckCircle className="w-4 h-4" />}>
                            Fiabilité
                        </Badge>
                        <Badge variant="gradient-purple" size="md" iconLeft={<Sparkles className="w-4 h-4" />}>
                            Simplicité
                        </Badge>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 relative z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <Button variant="outline" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
                            Découvrir la démo
                        </Button>
                    </motion.div>

                    {/* Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="max-w-4xl mx-auto"
                    >
                        <DashboardMockup />
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
