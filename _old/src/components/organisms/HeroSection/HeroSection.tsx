// src/components/organisms/HeroSection/HeroSection.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';

// Icons pour les badges de crédibilité
const ShieldIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

interface HeroSectionProps {
  readonly className?: string;
}

/**
 * Hero Section - Reprenez la main sur vos données pharmaceutiques
 * 
 * Section hero centrée avec tagline, sous-titre, CTA et mockup dashboard
 * Design Apple minimaliste avec badges de crédibilité
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  const handleStartClick = (): void => {
    console.log('Commencer clicked - TODO: Implement navigation');
    // TODO: Redirection vers page login/signup
  };

  return (
    <section className={`py-20 px-4 ${className}`}>
      <div className="container-apodata">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Tagline principale */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Reprenez la main
              </span>
              <br />
              <span className="text-gray-900">
                sur vos données
              </span>
            </h1>
          </motion.div>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Maîtrisez vos données pharmaceutiques avec une simplicité inégalée. 
            Performance, analyse et contrôle total, tout en interne.
          </motion.p>

          {/* Badges de crédibilité */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
          >
            <Badge 
              variant="gradient-blue" 
              size="md" 
              iconLeft={<ShieldIcon />}
            >
              Sécurité
            </Badge>
            <Badge 
              variant="gradient-green" 
              size="md" 
              iconLeft={<CheckCircleIcon />}
            >
              Fiabilité
            </Badge>
            <Badge 
              variant="gradient-purple" 
              size="md" 
              iconLeft={<SparklesIcon />}
            >
              Simplicité
            </Badge>
          </motion.div>

          {/* Call-to-Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="mb-16"
          >
            <Button
              variant="primary"
              size="xl"
              onClick={handleStartClick}
              iconRight={<ArrowRightIcon />}
            >
              Commencer
            </Button>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
            className="max-w-4xl mx-auto"
          >
            <Card variant="glass" padding="lg" className="overflow-hidden">
              <div className="space-y-6">
                
                {/* Header Mockup */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dashboard ApoData
                    </h3>
                  </div>
                  <Badge variant="success" size="sm" iconLeft={<CheckCircleIcon />}>
                    En ligne
                  </Badge>
                </div>

                {/* KPIs Mockup Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* KPI 1 - Sell-Out */}
                  <Card variant="elevated" padding="md">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          CA Sell-Out
                        </h4>
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">
                          245 850 €
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-green-600 font-medium">+12.5%</span>
                          <span className="text-gray-500 ml-1">ce mois</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* KPI 2 - Sell-In */}
                  <Card variant="elevated" padding="md">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          CA Sell-In
                        </h4>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">
                          189 420 €
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-orange-600 font-medium">-2.1%</span>
                          <span className="text-gray-500 ml-1">ce mois</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* KPI 3 - Stock */}
                  <Card variant="elevated" padding="md">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Stock Valorisé
                        </h4>
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">
                          89 640 €
                        </div>
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
          </motion.div>

        </div>
      </div>
    </section>
  );
};