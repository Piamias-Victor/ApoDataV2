// src/components/organisms/AboutSection/components/ContactForm.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { User, Mail, Send } from 'lucide-react';

interface FormData {
    name: string;
    email: string;
    message: string;
}

export const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulation d'envoi
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        alert("Message envoyé ! (Simulation)");
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
        >
            <Card variant="elevated" padding="lg" className="sticky top-24">
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Contactez-nous</h3>
                        <p className="text-gray-600">Une question ? Un projet ? Parlons-en !</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nom complet"
                            placeholder="Jean Dupont"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            iconLeft={<User className="w-4 h-4" />}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="jean.dupont@pharmacie.fr"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            iconLeft={<Mail className="w-4 h-4" />}
                            required
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Message *</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                                rows={4}
                                className="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="Votre message..."
                            />
                        </div>

                        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} iconRight={<Send className="w-4 h-4" />}>
                            Nous contacter
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500 text-center">Nous vous répondrons dans les 24h ouvrées</p>
                </div>
            </Card>
        </motion.div>
    );
};
