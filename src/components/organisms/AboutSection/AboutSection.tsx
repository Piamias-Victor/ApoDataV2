// src/components/organisms/AboutSection/AboutSection.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CompanyInfo } from './components/CompanyInfo';
import { ContactForm } from './components/ContactForm';

export const AboutSection: React.FC = () => {
    return (
        <section className="py-20 px-4">
            <div className="container-apodata">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        À propos
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        L&apos;alliance parfaite entre expertise technique et connaissance du milieu pharmaceutique
                    </p>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    <CompanyInfo />
                    <ContactForm />
                </div>

            </div>
        </section>
    );
};
