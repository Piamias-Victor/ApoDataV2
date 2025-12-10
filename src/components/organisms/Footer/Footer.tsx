// src/components/organisms/Footer/Footer.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/atoms/Badge/Badge';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <motion.footer
            className="fixed bottom-0 left-0 right-0 z-40 bg-gray-50 border-t border-gray-200"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="container-apodata">
                <div className="py-4">
                    <div className="flex items-center justify-center space-x-4">
                        <Badge variant="gradient-blue" size="xs">
                            v2.0.0-beta
                        </Badge>
                        <span className="text-xs text-gray-400">
                            © {currentYear} Phardev
                        </span>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
};
