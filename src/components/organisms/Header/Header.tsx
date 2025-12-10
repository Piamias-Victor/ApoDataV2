// src/components/organisms/Header/Header.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button/Button';

export const Header: React.FC = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container-apodata">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/">
                            <motion.h1
                                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                ApoData
                            </motion.h1>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {['Accueil', 'Fonctionnalités', 'À propos'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item === 'Accueil' ? 'top' : item === 'Fonctionnalités' ? 'features' : 'about')}
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center">
                        <Link href="/login">
                            <Button variant="primary" size="sm">
                                Se connecter
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};
