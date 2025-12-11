// src/components/organisms/FilterPanel/components/FranceMapSelector.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface FranceMapSelectorProps {
    selectedRegions: string[];
    onToggleRegion: (region: string) => void;
}

export const FranceMapSelector: React.FC<FranceMapSelectorProps> = ({
    selectedRegions,
    onToggleRegion
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const geoJsonLayerRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const onToggleRegionRef = useRef(onToggleRegion);

    useEffect(() => {
        onToggleRegionRef.current = onToggleRegion;
    }, [onToggleRegion]);

    // Init Map
    useEffect(() => {
        if (!isClient || !mapRef.current) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            if (mapInstanceRef.current) return;

            const map = L.map(mapRef.current!, {
                center: [46.603354, 1.888334],
                zoom: 5,
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false
            });

            mapInstanceRef.current = map;

            try {
                const response = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson');
                const geoData = await response.json();

                const layer = L.geoJSON(geoData, {
                    style: () => {
                        // Initial Style
                        return {
                            fillColor: '#e5e7eb',
                            weight: 1,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.5,
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        const regionName = feature.properties?.nom;

                        layer.on({
                            click: () => {
                                onToggleRegionRef.current(regionName);
                            },
                            mouseover: () => {
                                // Only highlight if not selected (handled by style update loop mostly, but visual feedback needed)
                                // We'll rely on our style update effect to keep 'selected' state true
                                // Here we just add a temporary hover effect if we want
                                if (!(layer as any).feature?.properties?.isSelected) {
                                    (layer as any).setStyle({ fillOpacity: 0.8 });
                                }
                            },
                            mouseout: () => {
                                if (!(layer as any).feature?.properties?.isSelected) {
                                    (layer as any).setStyle({ fillOpacity: 0.5 });
                                }
                            }
                        });
                    }
                }).addTo(map);

                geoJsonLayerRef.current = layer;

            } catch (error) {
                console.error('Error loading map data', error);
            } finally {
                setIsLoading(false);
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isClient]);

    // Update Styles efficiently
    useEffect(() => {
        if (!geoJsonLayerRef.current) return;

        geoJsonLayerRef.current.eachLayer((layer: any) => {
            if (layer.feature && layer.feature.properties) {
                const regionName = layer.feature.properties.nom;
                const isSelected = selectedRegions.includes(regionName);

                // Store selection state in feature for mouseover logic
                layer.feature.properties.isSelected = isSelected;

                layer.setStyle({
                    fillColor: isSelected ? '#f97316' : '#e5e7eb', // Orange vs Gray
                    fillOpacity: isSelected ? 1 : 0.5
                });
            }
        });
    }, [selectedRegions, isLoading]);

    if (!isClient) return <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />;

    return (
        <div className="relative w-full h-[320px] bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div ref={mapRef} className="w-full h-full" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-lg text-xs shadow-md border border-gray-100 z-[1000] pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span className="font-medium text-gray-700">Sélectionnée</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full" />
                    <span className="text-gray-500">Non sélectionnée</span>
                </div>
            </div>

            {/* Region Count Badge */}
            {selectedRegions.length > 0 && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-[1000]">
                    {selectedRegions.length} région{selectedRegions.length > 1 ? 's' : ''}
                </div>
            )}

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-[1001]">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};
