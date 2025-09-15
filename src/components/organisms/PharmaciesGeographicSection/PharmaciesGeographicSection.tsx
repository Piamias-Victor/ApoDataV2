// src/components/organisms/PharmaciesGeographicSection/PharmaciesGeographicSection.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Map, RotateCcw, Info } from 'lucide-react';
import { usePharmaciesGeographicData } from '@/hooks/pharmacies/usePharmaciesGeographicData';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { FranceMap } from './FranceMapLeaflet';

interface PharmaciesGeographicSectionProps {
  readonly dateRange: { start: string; end: string };
  readonly comparisonDateRange?: { start: string | null; end: string | null };
  readonly includeComparison?: boolean;
  readonly className?: string;
}

// Constantes pour les régions françaises
const REGIONS_FRANCE = {
  'ARA': { name: 'Auvergne-Rhône-Alpes', color: '#8B5CF6' },
  'BFC': { name: 'Bourgogne-Franche-Comté', color: '#10B981' },
  'BRE': { name: 'Bretagne', color: '#F59E0B' },
  'CVL': { name: 'Centre-Val de Loire', color: '#EF4444' },
  'COR': { name: 'Corse', color: '#06B6D4' },
  'GES': { name: 'Grand Est', color: '#84CC16' },
  'HDF': { name: 'Hauts-de-France', color: '#F97316' },
  'IDF': { name: 'Île-de-France', color: '#3B82F6' },
  'NOR': { name: 'Normandie', color: '#EC4899' },
  'NAQ': { name: 'Nouvelle-Aquitaine', color: '#14B8A6' },
  'OCC': { name: 'Occitanie', color: '#A855F7' },
  'PDL': { name: 'Pays de la Loire', color: '#22C55E' },
  'PAC': { name: 'Provence-Alpes-Côte d\'Azur', color: '#6366F1' }
};

export const PharmaciesGeographicSection: React.FC<PharmaciesGeographicSectionProps> = ({
  dateRange,
  comparisonDateRange,
  includeComparison = false,
  className = ''
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'ca_total' | 'nb_pharmacies' | 'ca_moyen_pharmacie'>('ca_total');

  const { 
    data, 
    isLoading, 
    error, 
    refetch
  } = usePharmaciesGeographicData({
    enabled: true,
    includeComparison,
    dateRange,
    comparisonDateRange: includeComparison ? comparisonDateRange : undefined
  });

  // Calcul des intensités de couleur
  const regionIntensities = useMemo(() => {
    if (!data?.regions) return {};

    const values = data.regions.map(r => r[selectedMetric]);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    const intensities: Record<string, number> = {};
    data.regions.forEach(region => {
      const normalizedValue = maxValue > minValue 
        ? (region[selectedMetric] - minValue) / (maxValue - minValue)
        : 0.5;
      intensities[region.regionCode] = normalizedValue;
    });

    return intensities;
  }, [data?.regions, selectedMetric]);

  // Obtenir la couleur d'une région
  const getRegionColor = (regionCode: string) => {
    const intensity = regionIntensities[regionCode] || 0;
    const hue = hoveredRegion === regionCode ? '220' : '210';
    const saturation = hoveredRegion === regionCode ? '80%' : '70%';
    const lightness = 90 - (intensity * 40);
    return `hsl(${hue}, ${saturation}, ${lightness}%)`;
  };

  // Données de la région survolée
  const hoveredRegionData = useMemo(() => {
    if (!hoveredRegion || !data?.regions) return null;
    return data.regions.find(r => r.regionCode === hoveredRegion);
  }, [hoveredRegion, data?.regions]);

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <Card variant="elevated" padding="lg" className={className}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <Map className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-red-700 mb-4">
            Impossible de charger les données géographiques
          </p>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleRefresh} 
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Map className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Répartition Géographique
          </h2>
          <Info className="w-4 h-4 text-gray-400" />
        </div>

        {/* Sélecteur métrique */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1"
          >
            <option value="ca_total">CA Total</option>
            <option value="nb_pharmacies">Nb Pharmacies</option>
            <option value="ca_moyen_pharmacie">CA Moyen/Pharmacie</option>
          </select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            iconLeft={<RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carte France */}
        <div className="lg:col-span-2">
          <div className="relative bg-gray-50 rounded-xl p-4 h-96">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : data?.regions ? (
              <FranceMap
                data={data.regions}
                selectedMetric={selectedMetric}
                hoveredRegion={hoveredRegion}
                onRegionHover={setHoveredRegion}
                getRegionColor={getRegionColor}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée géographique disponible
              </div>
            )}

            {/* Tooltip région survolée */}
            {hoveredRegionData && (
              <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {REGIONS_FRANCE[hoveredRegionData.regionCode as keyof typeof REGIONS_FRANCE]?.name || hoveredRegionData.regionName}
                </h4>
                <div className="space-y-1 text-sm">
                  <div>CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(hoveredRegionData.ca_total)}</div>
                  <div>Pharmacies: {hoveredRegionData.nb_pharmacies}</div>
                  <div>CA Moyen: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(hoveredRegionData.ca_moyen_pharmacie)}</div>
                  <div>Part de marché: {hoveredRegionData.part_marche_pct}%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liste des régions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Top Régions</h3>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data?.regions.slice(0, 10).map((region) => (
                <div
                  key={region.regionCode}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    hoveredRegion === region.regionCode 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHoveredRegion(region.regionCode)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {REGIONS_FRANCE[region.regionCode as keyof typeof REGIONS_FRANCE]?.name || region.regionCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {region.nb_pharmacies} pharmacies
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedMetric === 'ca_total' && 
                          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(region.ca_total)
                        }
                        {selectedMetric === 'nb_pharmacies' && region.nb_pharmacies}
                        {selectedMetric === 'ca_moyen_pharmacie' && 
                          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(region.ca_moyen_pharmacie)
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {region.part_marche_pct}% du total
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Intensité basée sur: {
            selectedMetric === 'ca_total' ? 'CA Total' :
            selectedMetric === 'nb_pharmacies' ? 'Nombre de pharmacies' :
            'CA Moyen par pharmacie'
          }</span>
          <div className="flex items-center space-x-2">
            <span>Faible</span>
            <div className="w-20 h-3 bg-gradient-to-r from-blue-100 to-blue-800 rounded"></div>
            <span>Élevé</span>
          </div>
        </div>
      </div>
    </Card>
  );
};