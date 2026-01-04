// src/components/organisms/LoginForm/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
    onRequires2FA: (creds: { email: string; password: string }) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onRequires2FA }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false
            });

            if (res?.error === '2FA_REQUIRED') {
                onRequires2FA({ email: formData.email, password: formData.password });
            } else if (res?.error) {
                setError('Email ou mot de passe incorrect');
            } else {
                router.push('/hub');
            }
        } catch {
            setError('Une erreur est survenue');
        } finally {
            if (!error) setLoading(false);
        }
    };

    return (
        <Card className="p-8 w-full max-w-md bg-white/90 backdrop-blur-xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
                <p className="text-gray-600">Accédez à votre espace sécurisé</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    type="email"
                    label="Email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    iconLeft={<Mail className="w-4 h-4" />}
                    required
                />
                <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Mot de passe"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    iconLeft={<Lock className="w-4 h-4" />}
                    iconRight={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    }
                    required
                />

                <div className="flex justify-end">
                    <a href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                        Mot de passe oublié ?
                    </a>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{error}</div>}

                <Button type="submit" iconLeft={<LogIn className="w-4 h-4" />} variant="primary" fullWidth loading={loading} size="lg">
                    Se connecter
                </Button>
            </form>
        </Card>
    );
};

