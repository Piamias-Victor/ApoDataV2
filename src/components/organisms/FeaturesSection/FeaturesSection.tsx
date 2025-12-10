// src/components/organisms/FeaturesSection/FeaturesSection.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { ArrowRight } from 'lucide-react';
import { features } from './data/features';

export const FeaturesSection: React.FC = () => {
    return (
        <section className="py-20 px-4 bg-white/30">
            <div className="container-apodata">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Fonctionnalités Dashboard
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Tout ce dont vous avez besoin pour reprendre le contrôle de vos données pharmaceutiques.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <Card variant="elevated" padding="lg" hoverable>
                                    <div className="space-y-4">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 text-white shadow-lg`}>
                                            <Icon className="w-full h-full" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-center"
                >
                    <Button variant="primary" size="xl" iconRight={<ArrowRight className="w-5 h-5" />}>
                        Découvrir ApoData
                    </Button>
                </motion.div>

            </div>
        </section>
    );
};
