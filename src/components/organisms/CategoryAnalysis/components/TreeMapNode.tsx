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
    const { x, y, width, height, index, rank } = props;

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
    const isTiny = width < 40 || height < 25;
    const isSmall = width < 80 || height < 40;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={6}
                ry={6}
                fill={color}
                stroke="#fff"
                strokeWidth={3}
                className="transition-all duration-200 hover:opacity-90 cursor-pointer hover:stroke-white/80"
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))' }}
            />
            {!isTiny && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    style={{ pointerEvents: 'none', textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}
                >
                    <tspan x={x + width / 2} dy={isSmall ? "0.3em" : "-0.6em"} fontSize={isSmall ? 10 : 13} fontWeight={400}>
                        {name.length > (isSmall ? 8 : 15) ? name.slice(0, isSmall ? 6 : 12) + '..' : name}
                    </tspan>
                    {!isSmall && (
                        <tspan x={x + width / 2} dy="1.4em" fontSize={11} fill="rgba(255,255,255,0.95)" fontWeight={400}>
                            {Number(percentage).toFixed(1)}%
                        </tspan>
                    )}
                </text>
            )}
        </g>
    );
};
