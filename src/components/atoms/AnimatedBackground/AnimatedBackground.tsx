// src/components/atoms/AnimatedBackground/AnimatedBackground.tsx
'use client';

import React from 'react';
import { Blob } from './components/Blob';
import { blobsData } from './components/blobsData';

export const AnimatedBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 w-full" style={{ height: '300vh' }}>
            {blobsData.map((blob, index) => (
                <Blob key={index} {...blob} />
            ))}
        </div>
    );
};
