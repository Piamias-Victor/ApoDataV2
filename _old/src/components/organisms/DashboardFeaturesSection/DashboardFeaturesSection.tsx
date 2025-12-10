// src/components/organisms/DashboardFeaturesSection/DashboardFeaturesSection.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3, 
  Handshake, 
  Settings, 
  Target,
  Download,
  ArrowRight
} from 'lucide-react';

interface DashboardFeature {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly gradient: string;
}

const features: DashboardFeature[] = [
  {
    title: "Maîtrisez vos ventes",
    description: "Analysez votre sell-out en temps réel avec des insights précis sur vos performances commerciales",
    icon: <ShoppingCart className="w-full h-full" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Optimisez vos achats", 
    description: "Suivez votre sell-in et négociez mieux avec vos laboratoires grâce aux données consolidées",
    icon: <TrendingUp className="w-full h-full" />,
    gradient: "from-green-500 to-emerald-500"
  },
  {
    title: "Gérez votre stock",
    description: "Analysez votre inventaire, évitez les ruptures et optimisez votre rotation de stock intelligemment",
    icon: <Package className="w-full h-full" />,
    gradient: "from-purple-500 to-violet-500"
  },
  {
    title: "Maximisez vos marges",
    description: "Analysez la rentabilité produit par produit et comparez vos fournisseurs pour optimiser vos profits",
    icon: <DollarSign className="w-full h-full" />,
    gradient: "from-orange-500 to-red-500"
  },
  {
    title: "Comparez-vous aux autres",
    description: "Benchmarkez vos performances avec des acteurs similaires et identifiez vos avantages compétitifs",
    icon: <BarChart3 className="w-full h-full" />,
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    title: "Renforcez votre négociation",
    description: "Utilisez des benchmarks prix détaillés pour négocier de meilleures conditions avec vos laboratoires",
    icon: <Handshake className="w-full h-full" />,
    gradient: "from-pink-500 to-rose-500"
  },
  {
    title: "Optimisez votre stock",
    description: "Améliorez votre rotation de stock et réduisez vos immobilisations pour une gestion efficace",
    icon: <Settings className="w-full h-full" />,
    gradient: "from-teal-500 to-green-500"
  },
  {
    title: "Optimisez vos prix",
    description: "Comparez vos tarifs et définissez votre positionnement prix pour maximiser vos revenus",
    icon: <Target className="w-full h-full" />,
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    title: "Exportez vos données",
    description: "Exportez facilement vos analyses et rapports dans vos formats préférés pour votre équipe",
    icon: <Download className="w-full h-full" />,
    gradient: "from-slate-500 to-gray-500"
  }
];

interface DashboardFeaturesSectionProps {
  readonly className?: string;
}

/**
 * Dashboard Features Section - 8 fonctionnalités clés d'ApoData
 * 
 * Grid 3x3 avec cards informatives, messaging bénéfice
 * CTA final pour engagement utilisateur
 */
export const DashboardFeaturesSection: React.FC<DashboardFeaturesSectionProps> = ({ 
  className = '' 
}) => {
  const handleDiscoverClick = (): void => {
    console.log('Découvrir clicked - TODO: Implement navigation');
    // TODO: Navigation vers dashboard ou demo
  };

  return (
    <section className={`py-20 px-4 ${className}`}>
      <div className="container-apodata">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Fonctionnalités Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tout ce dont vous avez besoin pour reprendre le contrôle de vos données pharmaceutiques. 
            Simple, puissant, et conçu pour les pharmaciens.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: 'easeOut' 
              }}
            >
              <Card variant="elevated" padding="lg" hoverable>
                <div className="space-y-4">
                  
                  {/* Icon avec gradient */}
                  <div className={`
                    w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} 
                    p-3 text-white shadow-lg
                  `}>
                    {feature.icon}
                  </div>
                  
                  {/* Titre */}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call-to-Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-center"
        >
          <Button
            variant="primary"
            size="xl"
            onClick={handleDiscoverClick}
            iconRight={<ArrowRight className="w-5 h-5" />}
          >
            Découvrir ApoData
          </Button>
        </motion.div>

      </div>
    </section>
  );
};