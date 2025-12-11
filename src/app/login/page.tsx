// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Header } from '@/components/organisms/Header/Header';
import { LoginForm } from '@/components/organisms/LoginForm/LoginForm';
import { TwoFactorModal } from '@/components/molecules/TwoFactorModal/TwoFactorModal';

export default function LoginPage() {
    const router = useRouter();
    const [show2FA, setShow2FA] = useState(false);
    const [pendingCreds, setPendingCreds] = useState({ email: '', password: '' });
    const [loading2FA, setLoading2FA] = useState(false);
    const [error2FA, setError2FA] = useState('');

    const handle2FAVerify = async (token: string) => {
        setLoading2FA(true);
        setError2FA('');

        try {
            const res = await signIn('credentials', {
                email: pendingCreds.email,
                password: pendingCreds.password,
                token,
                redirect: false
            });

            if (res?.error) {
                setError2FA('Code invalide');
            } else {
                router.push('/dashboard');
            }
        } finally {
            setLoading2FA(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            <AnimatedBackground />
            <Header />

            <main className="flex-1 flex items-center justify-center p-4 relative z-10">
                <LoginForm
                    onRequires2FA={(creds) => {
                        setPendingCreds(creds);
                        setShow2FA(true);
                    }}
                />
            </main>

            <TwoFactorModal
                isOpen={show2FA}
                onVerify={handle2FAVerify}
                onClose={() => setShow2FA(false)}
                isLoading={loading2FA}
                error={error2FA}
            />
        </div>
    );
}
