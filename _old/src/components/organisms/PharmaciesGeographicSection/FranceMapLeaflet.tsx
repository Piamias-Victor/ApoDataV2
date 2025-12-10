// src/components/organisms/PharmaciesGeographicSection/FranceMapLeaflet.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RegionData {
  regionCode: string;
  regionName: string;
  ca_total: number;
  nb_pharmacies: number;
  ca_moyen_pharmacie: number;
  part_marche_pct: number;
}

interface FranceMapProps {
  data: RegionData[];
  selectedMetric: 'ca_total' | 'nb_pharmacies' | 'ca_moyen_pharmacie';
  hoveredRegion: string | null;
  onRegionHover: (regionCode: string | null) => void;
  getRegionColor: (regionCode: string) => string;
}

export const FranceMap: React.FC<FranceMapProps> = ({
  data,
  selectedMetric,
  onRegionHover
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getRegionIntensity = (regionData: RegionData) => {
    if (data.length === 0) return '#f3f4f6';
    const maxValue = Math.max(...data.map(d => d[selectedMetric]));
    const intensity = regionData[selectedMetric] / maxValue;
    return `hsl(210, 70%, ${90 - intensity * 40}%)`;
  };

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Import dynamique de Leaflet
    Promise.all([
      import('leaflet'),
      // Import du CSS via un link tag
      new Promise<void>((resolve) => {
        if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.onload = () => resolve();
          document.head.appendChild(link);
        } else {
          resolve();
        }
      })
    ]).then(([L]) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        center: [46.5, 2.5],
        zoom: 5,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      const geoJsonUrl = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson';
      
      fetch(geoJsonUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(geoData => {
          console.log('Carte chargée avec succès');
          
          L.geoJSON(geoData, {
            style: (feature) => {
              const regionName = feature?.properties?.nom;
              const regionData = data.find(d => 
                d.regionName.includes(regionName) || 
                regionName.includes(d.regionName) ||
                d.regionCode === feature?.properties?.code
              );

              return {
                fillColor: regionData ? getRegionIntensity(regionData) : '#f3f4f6',
                weight: 2,
                opacity: 1,
                color: '#94a3b8',
                fillOpacity: regionData ? 0.8 : 0.3
              };
            },
            onEachFeature: (feature, layer) => {
              const regionName = feature.properties?.nom;
              const regionData = data.find(d => 
                d.regionName.includes(regionName) || 
                regionName.includes(d.regionName)
              );
              
              const pathLayer = layer as any;
              
              layer.on({
                mouseover: () => {
                  if (regionData) {
                    onRegionHover(regionData.regionCode);
                    pathLayer.setStyle({ weight: 3, color: '#2563eb' });
                  }
                },
                mouseout: () => {
                  onRegionHover(null);
                  pathLayer.setStyle({ weight: 2, color: '#94a3b8' });
                }
              });

              if (regionData) {
                layer.bindTooltip(`
                  <div style="
                    font-family: system-ui; 
                    padding: 12px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border: 1px solid #e5e7eb;
                    min-width: 200px;
                  ">
                    <strong style="color: #374151; font-size: 14px; display: block; margin-bottom: 8px;">
                      ${regionName}
                    </strong>
                    <div style="color: #6b7280; font-size: 12px; line-height: 1.4;">
                      <div style="margin-bottom: 4px;">
                        <strong>CA:</strong> ${new Intl.NumberFormat('fr-FR', { 
                          style: 'currency', 
                          currency: 'EUR',
                          maximumFractionDigits: 0 
                        }).format(regionData.ca_total)}
                      </div>
                      <div style="margin-bottom: 4px;">
                        <strong>Pharmacies:</strong> ${regionData.nb_pharmacies}
                      </div>
                      <div>
                        <strong>Part:</strong> ${regionData.part_marche_pct}%
                      </div>
                    </div>
                  </div>
                `, {
                  permanent: false,
                  sticky: false,
                  direction: 'right',
                  offset: [15, 0],
                  className: 'custom-leaflet-tooltip'
                });
              }
            }
          }).addTo(map);
        })
        .catch(error => {
          console.error('Erreur chargement GeoJSON:', error);
          
          setTimeout(() => {
            const mapContainer = map.getContainer();
            const hasLayers = mapContainer.querySelector('.leaflet-overlay-pane svg');
            
            if (!hasLayers) {
              const errorDiv = document.createElement('div');
              errorDiv.innerHTML = `
                <div style="
                  position: absolute; 
                  top: 50%; 
                  left: 50%; 
                  transform: translate(-50%, -50%);
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  text-align: center;
                  font-family: system-ui;
                  z-index: 1000;
                ">
                  <h3 style="margin: 0 0 10px 0; color: #dc2626;">Carte non disponible</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    La carte géographique ne peut pas être affichée.<br/>
                    Les données restent disponibles dans la liste.
                  </p>
                </div>
              `;
              mapContainer.appendChild(errorDiv);
            }
          }, 2000);
        });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, data, selectedMetric, onRegionHover]);

  if (!isClient) {
    return (
      <div className="relative w-full h-96">
        <div className="w-full h-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96">
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200" />
      
      {/* Styles CSS pour les tooltips */}
      <style jsx global>{`
        .custom-leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          z-index: 9999 !important;
        }
        
        .leaflet-tooltip {
          z-index: 9999 !important;
          position: relative !important;
        }
        
        .leaflet-tooltip-pane {
          z-index: 9999 !important;
        }
        
        .leaflet-container {
          font-family: inherit;
          z-index: 1 !important;
        }
        
        .leaflet-control-container {
          z-index: 2 !important;
        }
        
        .leaflet-popup-pane,
        .leaflet-tooltip-pane {
          z-index: 9999 !important;
        }
      `}</style>
    </div>
  );
};