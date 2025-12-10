// src/components/atoms/AnimatedBackground/AnimatedBackground.tsx
'use client';

import { motion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full" style={{ height: '300vh' }}>
      
      {/* SECTION HAUT - Blobs existants (0-33vh) */}
      
      {/* Blob 1 - Coin haut gauche */}
      <motion.div
        className="absolute w-80 h-72 bg-gradient-to-br from-blue-400/70 via-cyan-300/50 to-sky-200/40 filter blur-xl"
        style={{ 
          left: '-10%', 
          top: '-5%',
          borderRadius: '65% 35% 25% 75% / 55% 25% 75% 45%',
          transform: 'rotate(18deg)'
        }}
        animate={{
          x: [0, 80, -60, 45, 0],
          y: [0, -70, 85, -50, 0],
          scale: [1, 1.3, 0.7, 1.2, 1],
          rotate: [18, 80, -35, 60, 18],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Blob 2 - Coin haut droit */}
      <motion.div
        className="absolute w-68 h-84 bg-gradient-to-tl from-pink-400/70 via-fuchsia-300/50 to-rose-200/40 filter blur-xl"
        style={{ 
          right: '-8%', 
          top: '-10%',
          borderRadius: '35% 65% 75% 25% / 45% 65% 35% 75%',
          transform: 'rotate(-25deg)'
        }}
        animate={{
          x: [0, -75, 65, -40, 0],
          y: [0, 60, -90, 55, 0],
          scale: [1, 0.6, 1.4, 0.8, 1],
          rotate: [-25, 35, -80, 20, -25],
        }}
        transition={{
          duration: 18,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 - Centre haut */}
      <motion.div
        className="absolute w-56 h-64 bg-gradient-to-br from-yellow-400/70 via-lime-300/50 to-green-200/40 filter blur-xl"
        style={{ 
          left: '40%', 
          top: '5%',
          borderRadius: '80% 20% 40% 60% / 30% 70% 20% 80%',
          transform: 'rotate(-8deg)'
        }}
        animate={{
          x: [0, -55, 75, -65, 0],
          y: [0, 90, -70, 50, 0],
          scale: [1, 1.6, 0.6, 1.3, 1],
          rotate: [-8, 65, -55, 40, -8],
        }}
        transition={{
          duration: 21,
          delay: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* SECTION MILIEU - Nouveaux blobs (33vh-66vh) */}
      
      {/* Blob 10 - Milieu gauche haut */}
      <motion.div
        className="absolute w-72 h-88 bg-gradient-to-br from-indigo-400/60 via-blue-300/40 to-cyan-200/30 filter blur-xl"
        style={{ 
          left: '-12%', 
          top: '25%',
          borderRadius: '55% 45% 30% 70% / 40% 60% 30% 70%',
          transform: 'rotate(45deg)'
        }}
        animate={{
          x: [0, 70, -90, 60, 0],
          y: [0, -80, 60, -40, 0],
          scale: [1, 1.2, 0.8, 1.4, 1],
          rotate: [45, -20, 85, 30, 45],
        }}
        transition={{
          duration: 19,
          delay: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 11 - Milieu centre */}
      <motion.div
        className="absolute w-96 h-64 bg-gradient-to-tl from-purple-400/60 via-pink-300/40 to-rose-200/30 filter blur-xl"
        style={{ 
          left: '35%', 
          top: '30%',
          borderRadius: '70% 30% 60% 40% / 50% 50% 50% 50%',
          transform: 'rotate(-30deg)'
        }}
        animate={{
          x: [0, -60, 80, -45, 0],
          y: [0, 70, -85, 55, 0],
          scale: [1, 0.9, 1.5, 1.1, 1],
          rotate: [-30, 40, -75, 25, -30],
        }}
        transition={{
          duration: 24,
          delay: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 12 - Milieu droit */}
      <motion.div
        className="absolute w-84 h-76 bg-gradient-to-bl from-green-400/60 via-emerald-300/40 to-teal-200/30 filter blur-xl"
        style={{ 
          right: '-15%', 
          top: '35%',
          borderRadius: '40% 60% 80% 20% / 60% 40% 20% 80%',
          transform: 'rotate(60deg)'
        }}
        animate={{
          x: [0, -95, 50, -75, 0],
          y: [0, 65, -70, 85, 0],
          scale: [1, 1.3, 0.7, 1.2, 1],
          rotate: [60, -15, 95, 45, 60],
        }}
        transition={{
          duration: 17,
          delay: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 13 - Milieu gauche bas */}
      <motion.div
        className="absolute w-68 h-92 bg-gradient-to-tr from-orange-400/60 via-yellow-300/40 to-amber-200/30 filter blur-xl"
        style={{ 
          left: '10%', 
          top: '45%',
          borderRadius: '85% 15% 25% 75% / 35% 65% 75% 25%',
          transform: 'rotate(15deg)'
        }}
        animate={{
          x: [0, 85, -55, 70, 0],
          y: [0, -60, 90, -75, 0],
          scale: [1, 0.8, 1.6, 0.9, 1],
          rotate: [15, 70, -50, 90, 15],
        }}
        transition={{
          duration: 20,
          delay: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 14 - Milieu centre droit */}
      <motion.div
        className="absolute w-88 h-72 bg-gradient-to-bl from-red-400/60 via-pink-300/40 to-purple-200/30 filter blur-xl"
        style={{ 
          right: '20%', 
          top: '50%',
          borderRadius: '30% 70% 45% 55% / 70% 30% 55% 45%',
          transform: 'rotate(-45deg)'
        }}
        animate={{
          x: [0, -50, 95, -80, 0],
          y: [0, 80, -55, 65, 0],
          scale: [1, 1.4, 0.6, 1.3, 1],
          rotate: [-45, 30, -85, 15, -45],
        }}
        transition={{
          duration: 22,
          delay: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* SECTION BAS - Nouveaux blobs (66vh-100vh) */}

      {/* Blob 15 - Bas gauche haut */}
      <motion.div
        className="absolute w-76 h-84 bg-gradient-to-br from-violet-400/60 via-indigo-300/40 to-blue-200/30 filter blur-xl"
        style={{ 
          left: '-8%', 
          top: '70%',
          borderRadius: '60% 40% 70% 30% / 45% 55% 35% 65%',
          transform: 'rotate(25deg)'
        }}
        animate={{
          x: [0, 75, -85, 55, 0],
          y: [0, -70, 65, -90, 0],
          scale: [1, 1.1, 0.9, 1.5, 1],
          rotate: [25, -60, 80, 35, 25],
        }}
        transition={{
          duration: 18,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 16 - Bas centre */}
      <motion.div
        className="absolute w-92 h-68 bg-gradient-to-tl from-cyan-400/60 via-blue-300/40 to-indigo-200/30 filter blur-xl"
        style={{ 
          left: '40%', 
          top: '75%',
          borderRadius: '75% 25% 50% 50% / 25% 75% 50% 50%',
          transform: 'rotate(-20deg)'
        }}
        animate={{
          x: [0, -65, 80, -50, 0],
          y: [0, 55, -75, 70, 0],
          scale: [1, 0.7, 1.4, 1.1, 1],
          rotate: [-20, 55, -70, 40, -20],
        }}
        transition={{
          duration: 25,
          delay: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 17 - Bas droit */}
      <motion.div
        className="absolute w-80 h-76 bg-gradient-to-bl from-emerald-400/60 via-green-300/40 to-lime-200/30 filter blur-xl"
        style={{ 
          right: '-10%', 
          top: '80%',
          borderRadius: '45% 55% 65% 35% / 55% 45% 65% 35%',
          transform: 'rotate(50deg)'
        }}
        animate={{
          x: [0, -80, 60, -95, 0],
          y: [0, 70, -60, 85, 0],
          scale: [1, 1.3, 0.8, 1.2, 1],
          rotate: [50, -25, 75, 20, 50],
        }}
        transition={{
          duration: 16,
          delay: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* BLOBS ADDITIONNELS POUR REMPLISSAGE */}

      {/* Blob 18 - Extra milieu gauche */}
      <motion.div
        className="absolute w-64 h-80 bg-gradient-to-tr from-pink-400/50 via-rose-300/30 to-red-200/20 filter blur-xl"
        style={{ 
          left: '5%', 
          top: '60%',
          borderRadius: '80% 20% 30% 70% / 40% 60% 70% 30%',
          transform: 'rotate(35deg)'
        }}
        animate={{
          x: [0, 50, -70, 40, 0],
          y: [0, -50, 60, -35, 0],
          scale: [1, 1.2, 0.9, 1.4, 1],
          rotate: [35, -40, 70, 10, 35],
        }}
        transition={{
          duration: 23,
          delay: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 19 - Extra milieu droit */}
      <motion.div
        className="absolute w-72 h-64 bg-gradient-to-bl from-yellow-400/50 via-orange-300/30 to-red-200/20 filter blur-xl"
        style={{ 
          right: '15%', 
          top: '65%',
          borderRadius: '25% 75% 55% 45% / 65% 35% 45% 55%',
          transform: 'rotate(-35deg)'
        }}
        animate={{
          x: [0, -45, 75, -60, 0],
          y: [0, 65, -45, 80, 0],
          scale: [1, 0.8, 1.5, 1.0, 1],
          rotate: [-35, 45, -65, 25, -35],
        }}
        transition={{
          duration: 21,
          delay: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 20 - Extra haut centre */}
      <motion.div
        className="absolute w-56 h-72 bg-gradient-to-br from-indigo-400/50 via-purple-300/30 to-pink-200/20 filter blur-xl"
        style={{ 
          left: '60%', 
          top: '15%',
          borderRadius: '70% 30% 40% 60% / 30% 70% 60% 40%',
          transform: 'rotate(10deg)'
        }}
        animate={{
          x: [0, -35, 55, -40, 0],
          y: [0, 45, -60, 35, 0],
          scale: [1, 1.3, 0.7, 1.1, 1],
          rotate: [10, 60, -45, 30, 10],
        }}
        transition={{
          duration: 19,
          delay: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blobs existants pour le bas */}
      
      {/* Blob 5 - Coin bas gauche */}
      <motion.div
        className="absolute w-76 h-68 bg-gradient-to-bl from-orange-400/70 via-amber-300/50 to-yellow-200/40 filter blur-xl"
        style={{ 
          left: '-8%', 
          top: '85%',
          borderRadius: '25% 75% 65% 35% / 75% 25% 35% 65%',
          transform: 'rotate(28deg)'
        }}
        animate={{
          x: [0, 90, -65, 70, 0],
          y: [0, -80, 70, -45, 0],
          scale: [1, 1.4, 0.8, 1.15, 1],
          rotate: [28, -25, 85, 35, 28],
        }}
        transition={{
          duration: 16,
          delay: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Blob 6 - Coin bas droit */}
      <motion.div
        className="absolute w-72 h-60 bg-gradient-to-tl from-red-400/70 via-pink-300/50 to-rose-200/40 filter blur-xl"
        style={{ 
          right: '-5%', 
          top: '90%',
          borderRadius: '40% 60% 20% 80% / 60% 40% 80% 20%',
          transform: 'rotate(38deg)'
        }}
        animate={{
          x: [0, -70, 85, -50, 0],
          y: [0, -55, 65, -75, 0],
          scale: [1, 0.7, 1.5, 0.9, 1],
          rotate: [38, 15, -60, 90, 38],
        }}
        transition={{
          duration: 19,
          delay: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob centre bas */}
      <motion.div
        className="absolute w-48 h-72 bg-gradient-to-bl from-slate-400/70 via-blue-300/50 to-gray-200/40 filter blur-xl"
        style={{ 
          left: '45%', 
          top: '95%',
          borderRadius: '60% 40% 80% 20% / 40% 60% 20% 80%',
          transform: 'rotate(-35deg)'
        }}
        animate={{
          x: [0, -80, 60, -45, 0],
          y: [0, 70, -85, 95, 0],
          scale: [1, 1.2, 0.75, 1.4, 1],
          rotate: [-35, 25, -95, 15, -35],
        }}
        transition={{
          duration: 17,
          delay: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 21 - Extra droite milieu */}
      <motion.div
        className="absolute w-84 h-68 bg-gradient-to-bl from-cyan-400/60 via-teal-300/40 to-blue-200/30 filter blur-xl"
        style={{ 
          right: '5%', 
          top: '55%',
          borderRadius: '65% 35% 50% 50% / 35% 65% 50% 50%',
          transform: 'rotate(20deg)'
        }}
        animate={{
          x: [0, -55, 75, -40, 0],
          y: [0, 60, -70, 45, 0],
          scale: [1, 1.3, 0.8, 1.1, 1],
          rotate: [20, -50, 75, 30, 20],
        }}
        transition={{
          duration: 18,
          delay: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
    </div>
  );
};