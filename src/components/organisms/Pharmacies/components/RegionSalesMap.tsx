'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { formatCurrency } from '@/lib/utils/formatters';

interface RegionData {
    region: string;
    value: number; // Sales amount
}

interface RegionSalesMapProps {
    data: RegionData[];
    onRegionClick: (region: string, isCtrlClick: boolean) => void;
    isLoading?: boolean;
}

export const RegionSalesMap: React.FC<RegionSalesMapProps> = ({
    data,
    onRegionClick,
    isLoading = false
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const geoJsonLayerRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false);

    // Calculate Min/Max for color scaling
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const minValue = Math.min(...data.map(d => d.value), maxValue);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const onRegionClickRef = useRef(onRegionClick);
    useEffect(() => {
        onRegionClickRef.current = onRegionClick;
    }, [onRegionClick]);

    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Color Scale Generator (Blue/Indigo Gradient)
    const getColor = (value: number) => {
        if (value === 0) return '#f3f4f6'; // Gray for no sales
        const range = maxValue - minValue || 1;
        const normalized = (value - minValue) / range;

        // Simple interpolation between Light Blue (#e0e7ff) and Deep Indigo (#312e81)
        // Or using steps
        if (normalized > 0.8) return '#312e81'; // 900
        if (normalized > 0.6) return '#4338ca'; // 700
        if (normalized > 0.4) return '#6366f1'; // 500
        if (normalized > 0.2) return '#818cf8'; // 400
        return '#c7d2fe'; // 200
    };

    // Init Map
    useEffect(() => {
        // Wait for client-side and NO loading state before initializing map on the ref
        if (!isClient || !mapRef.current || isLoading) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            if (mapInstanceRef.current) {
                // Ensure map is invalidated/resized if correct
                mapInstanceRef.current.invalidateSize();
                return;
            }

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
                    style: (feature) => {
                        const regionName = feature?.properties?.nom;
                        const regionData = dataRef.current.find(d => d.region === regionName);
                        return {
                            fillColor: getColor(regionData?.value || 0),
                            weight: 1,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.9,
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        const regionName = feature.properties?.nom;

                        // Tooltip
                        layer.bindTooltip(() => {
                            const d = dataRef.current.find(x => x.region === regionName);
                            return `<b>${regionName}</b><br/>${formatCurrency(d?.value || 0)}`;
                        }, {
                            permanent: false,
                            direction: 'top',
                            className: 'region-tooltip px-2 py-1 bg-white text-xs rounded shadow-md border border-gray-100'
                        });

                        layer.on({
                            click: (e) => {
                                const isCtrl = e.originalEvent.ctrlKey || e.originalEvent.metaKey;
                                onRegionClickRef.current(regionName, isCtrl);
                            },
                            mouseover: (e) => {
                                const l = e.target;
                                l.setStyle({ weight: 2, color: '#6366f1', fillOpacity: 1 });
                                l.bringToFront();
                            },
                            mouseout: (e) => {
                                const l = e.target;
                                const d = dataRef.current.find(x => x.region === regionName);
                                // Manually reset style to ensure it goes back to data-driven color
                                l.setStyle({
                                    weight: 1,
                                    color: 'white',
                                    fillColor: getColor(d?.value || 0),
                                    fillOpacity: 0.9
                                });
                            }
                        });
                    }
                }).addTo(map);

                geoJsonLayerRef.current = layer;

            } catch (error) {
                console.error('Error loading map data', error);
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [isClient, isLoading]);

    // Update Styles when data changes
    useEffect(() => {
        if (!geoJsonLayerRef.current) return;

        geoJsonLayerRef.current.eachLayer((layer: any) => {
            if (layer.feature && layer.feature.properties) {
                const regionName = layer.feature.properties.nom;
                const regionData = data.find(d => d.region === regionName);

                layer.setStyle({
                    fillColor: getColor(regionData?.value || 0),
                    fillOpacity: 0.9
                });
            }
        });
    }, [data, maxValue, minValue]);

    if (!isClient || isLoading) return <div className="h-[320px] bg-gray-50 rounded-xl animate-pulse" />;

    return (
        <div className="relative w-full h-[320px] bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm group">
            <div ref={mapRef} className="w-full h-full" />

            {/* Legend / Gradient Scale - Top Right */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg text-[10px] shadow-md border border-gray-100 z-[1000] flex flex-col gap-1 w-32">
                <div className="flex justify-between text-gray-500 mb-1">
                    <span>min</span>
                    <span>max</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#c7d2fe] via-[#6366f1] to-[#312e81]" />
            </div>
        </div>
    );
};
