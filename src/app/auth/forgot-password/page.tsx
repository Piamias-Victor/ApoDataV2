// src/app/auth/forgot-password/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Card } from '@/components/atoms/Card/Card';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulation de l'envoi d'email (Mock) car pas de DB autorisée pour l'instant
        setTimeout(() => {
            setSubmitted(true);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
            <AnimatedBackground />

            <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl relative z-10">
                <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
                </Link>

                {submitted ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Email envoyé !</h2>
                        <p className="text-gray-600">
                            Si un compte existe avec cet email, vous recevrez les instructions de réinitialisation.
                        </p>
                        <Link href="/login">
                            <Button variant="outline" fullWidth className="mt-6">
                                Retour à la connexion
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h1>
                            <p className="text-gray-600">Entrez votre email pour recevoir les instructions.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                iconLeft={<Mail className="w-4 h-4" />}
                                required
                            />
                            <Button type="submit" variant="primary" fullWidth loading={loading}>
                                Envoyer les instructions
                            </Button>
                        </form>
                    </>
                )}
            </Card>
        </div>
    );
}
