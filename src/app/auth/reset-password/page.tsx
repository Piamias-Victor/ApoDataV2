'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Card } from '@/components/atoms/Card/Card';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError("Le lien de réinitialisation est manquant.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Une erreur est survenue.");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mot de passe mis à jour !</h2>
                <p className="text-gray-600">
                    Votre compte a été activé avec succès. Vous allez être redirigé vers la connexion.
                </p>
                <Link href="/login">
                    <Button variant="primary" fullWidth className="mt-6">
                        Se connecter
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Définir le mot de passe</h1>
                <p className="text-gray-600">Choisissez un mot de passe sécurisé pour votre compte.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <Input
                    type="password"
                    label="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    iconLeft={<Lock className="w-4 h-4" />}
                    required
                />

                <Input
                    type="password"
                    label="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    iconLeft={<Lock className="w-4 h-4" />}
                    required
                />

                <Button type="submit" variant="primary" fullWidth loading={loading} disabled={!!error && !token}>
                    Valider mon compte
                </Button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
            <AnimatedBackground />

            <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl relative z-10">
                <Suspense fallback={<div className="text-center py-4">Chargement...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </Card>
        </div>
    );
}
