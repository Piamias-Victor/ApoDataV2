import React from 'react';

// Reuse Palette from a shared constant if possible, or define here.
const PALETTE = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#84cc16',
    '#d946ef', '#0ea5e9'
];

export const getCategoryColor = (index: number, isOther: boolean) => {
    if (isOther) return '#94a3b8';
    return PALETTE[index % PALETTE.length];
};

export const TreeMapNode = (props: any) => {
    const { x, y, width, height, index, rank, onNodeClick } = props;

    // Safely extract data
    const payload = props.payload || {};
    const name = payload.name || props.name || '';
    const percentage = payload.percentage || props.percentage || 0;

    const isOther = name.startsWith('Autres');
    const colorIndex = (rank ? rank - 1 : index);
    const color = getCategoryColor(colorIndex, isOther);

    // Dimensions check
    if (!width || !height || width < 5 || height < 5) return null;

    // Visibility Logic
    const isTiny = width < 40 || height < 30;
    const isSmall = width < 100 || height < 50;

    const handleClick = (e: React.MouseEvent) => {
        if (onNodeClick) {
            onNodeClick(props, index, e);
        }
    };

    return (
        <g className="treemap-node-root">
            {/* 1. Base SVG Rect for Color (Best for performance/chart logic) */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={6}
                ry={6}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onClick={handleClick}
            />
            
            {/* 2. HTML Overlay for Perfect Text Rendering */}
            {!isTiny && (
                <foreignObject 
                    x={x} 
                    y={y} 
                    width={width} 
                    height={height}
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                    <div 
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div 
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                padding: isSmall ? '2px 6px' : '4px 10px',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0px',
                                maxWidth: `${width - 8}px`, // Prevent overflow
                                minWidth: isSmall ? '50px' : '80px',
                                textAlign: 'center'
                            }}
                        >
                            {/* Category Name */}
                            <span 
                                style={{
                                    color: '#0f172a', // Slate-900 (High Contrast)
                                    fontSize: isSmall ? '11px' : '15px',
                                    fontWeight: 800, // Extra Bold
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    // Fix for "half written" - force GPU rasterization if needed, usually HTML is fine
                                    WebkitFontSmoothing: 'antialiased',
                                }}
                            >
                                {name}
                            </span>

                            {/* Percentage */}
                            {!isSmall && (
                                <span 
                                    style={{
                                        color: '#475569', // Slate-600
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        marginTop: '1px'
                                    }}
                                >
                                    {Number(percentage).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>
                </foreignObject>
            )}
        </g>
    );
};
