// src/components/atoms/AnimatedBackground/components/Blob.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface BlobProps {
    width: string;
    height: string;
    gradient: string;
    initialPosition: { left?: string; right?: string; top?: string; bottom?: string };
    initialRotation: string;
    borderRadius: string;
    animation: {
        x: number[];
        y: number[];
        scale: number[];
        rotate: number[];
    };
    duration: number;
    delay?: number;
}

export const Blob: React.FC<BlobProps> = ({
    width,
    height,
    gradient,
    initialPosition,
    initialRotation,
    borderRadius,
    animation,
    duration,
    delay = 0,
}) => {
    return (
        <motion.div
            className={`absolute ${width} ${height} ${gradient} filter blur-xl`}
            style={{
                ...initialPosition,
                borderRadius,
                transform: `rotate(${initialRotation})`
            }}
            animate={animation}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
};
