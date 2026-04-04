import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-secondary"
    >
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Simple Hand/Nail SVG Animation */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Finger/Nail */}
          <path 
            d="M80 150 C 80 100, 120 100, 120 150 L 120 200 L 80 200 Z" 
            fill="#F5CBBA" 
          />
          {/* Nail Base */}
          <path 
            d="M85 110 C 85 80, 115 80, 115 110 L 115 130 C 115 140, 85 140, 85 130 Z" 
            fill="#FFF5F5" 
          />
          
          {/* Animated Polish Color */}
          <motion.path 
            d="M85 110 C 85 80, 115 80, 115 110 L 115 130 C 115 140, 85 140, 85 130 Z" 
            fill="var(--color-accent)"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)' }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Brush */}
          <motion.g
            initial={{ x: 50, y: -50, rotate: 45 }}
            animate={{ 
              x: [50, 0, 10, -10, 0, 50], 
              y: [-50, 0, 10, 20, 30, -50],
              rotate: [45, 0, -10, 10, 0, 45]
            }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          >
            <rect x="95" y="40" width="10" height="40" fill="#333" rx="2" />
            <path d="M90 80 L110 80 L105 100 L95 100 Z" fill="var(--color-accent)" />
          </motion.g>
        </svg>
      </div>
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-6 text-2xl font-display text-accent tracking-widest"
      >
        Letícia Studio
      </motion.h2>
    </motion.div>
  );
}
