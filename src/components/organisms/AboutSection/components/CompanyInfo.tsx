// src/components/organisms/AboutSection/components/CompanyInfo.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/atoms/Badge/Badge';

export const CompanyInfo: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
        >
            {/* Phardev Introduction */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3">
                    <h3 className="text-2xl font-bold text-gray-900">Phardev</h3>
                    <Badge variant="gradient-blue" size="md">Expertise Pharma</Badge>
                </div>

                <p className="text-lg text-gray-600 leading-relaxed">
                    Chez Phardev, nous ne sommes pas que des développeurs. Nous sommes des spécialistes
                    qui comprennent vraiment les défis quotidiens des pharmaciens. Notre équipe combine
                    une expertise technique de pointe avec une connaissance approfondie du secteur pharmaceutique.
                </p>

                <p className="text-lg text-gray-600 leading-relaxed">
                    Cette double compétence nous permet de créer des solutions qui ne sont pas seulement
                    techniquement excellentes, mais qui répondent vraiment aux besoins concrets
                    de votre officine.
                </p>
            </div>

            {/* Philosophie */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Notre Philosophie</h3>

                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                        <p className="text-gray-600">
                            <strong className="text-gray-900">Simplicité d&apos;abord :</strong> Fini les interfaces complexes.
                            Nous croyons qu&apos;un outil puissant peut être simple à utiliser.
                        </p>
                    </div>

                    <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                        <p className="text-gray-600">
                            <strong className="text-gray-900">Fiabilité totale :</strong> Des données sécurisées
                            et une stabilité à toute épreuve pour votre activité quotidienne.
                        </p>
                    </div>

                    <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
                        <p className="text-gray-600">
                            <strong className="text-gray-900">Maîtrise totale :</strong> Vos données vous appartiennent.
                            Reprenez le contrôle avec des outils pensés pour vous.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
