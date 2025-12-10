// src/components/atoms/AnimatedBackground/components/blobsData.ts
import { BlobProps } from './Blob';

export const blobsData: Omit<BlobProps, 'className'>[] = [
    {
        width: 'w-80',
        height: 'h-72',
        gradient: 'bg-gradient-to-br from-blue-400/70 via-cyan-300/50 to-sky-200/40',
        initialPosition: { left: '-10%', top: '-5%' },
        initialRotation: '18deg',
        borderRadius: '65% 35% 25% 75% / 55% 25% 75% 45%',
        animation: { x: [0, 80, -60, 45, 0], y: [0, -70, 85, -50, 0], scale: [1, 1.3, 0.7, 1.2, 1], rotate: [18, 80, -35, 60, 18] },
        duration: 15
    },
    {
        width: 'w-68',
        height: 'h-84',
        gradient: 'bg-gradient-to-tl from-pink-400/70 via-fuchsia-300/50 to-rose-200/40',
        initialPosition: { right: '-8%', top: '-10%' },
        initialRotation: '-25deg',
        borderRadius: '35% 65% 75% 25% / 45% 65% 35% 75%',
        animation: { x: [0, -75, 65, -40, 0], y: [0, 60, -90, 55, 0], scale: [1, 0.6, 1.4, 0.8, 1], rotate: [-25, 35, -80, 20, -25] },
        duration: 18,
        delay: 1
    },
    // ... autres blobs (simplifiés pour l'exemple, à compléter si besoin de tous les 6)
    {
        width: 'w-56',
        height: 'h-64',
        gradient: 'bg-gradient-to-br from-yellow-400/70 via-lime-300/50 to-green-200/40',
        initialPosition: { left: '40%', top: '5%' },
        initialRotation: '-8deg',
        borderRadius: '80% 20% 40% 60% / 30% 70% 20% 80%',
        animation: { x: [0, -55, 75, -65, 0], y: [0, 90, -70, 50, 0], scale: [1, 1.6, 0.6, 1.3, 1], rotate: [-8, 65, -55, 40, -8] },
        duration: 21,
        delay: 6
    }
];
