// src/app/setup-2fa/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Notification } from '@/components/atoms/Notification/Notification';

export default function Setup2FAPage(): JSX.Element {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  useEffect(() => {
    console.log('📱 Setup2FA - Session:', {
      hasSession: !!session,
      email: session?.user?.email,
      twoFactorEnabled: session?.user?.twoFactorEnabled
    });

    if (session?.user?.twoFactorEnabled) {
      console.log('✅ 2FA already enabled - redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    if (session?.user) {
      setupTwoFactor();
    }
  }, [session]);

  const setupTwoFactor = async () => {
    try {
      console.log('🔐 Generating QR code...');
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST'
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      console.log('✅ QR code generated');
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (error) {
      console.error('❌ Error generating QR:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Erreur lors de la génération du QR code'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (token.length !== 6) return;

    setIsVerifying(true);
    console.log('🔑 Verifying token...');

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Code invalide');
      }

      console.log('✅ Token valid - updating session...');
      await update();
      
      setNotification({
        show: true,
        type: 'success',
        message: '2FA activé avec succès !'
      });

      setTimeout(() => {
        console.log('🚀 Redirecting to dashboard');
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('❌ Verification error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Code invalide, réessayez'
      });
      setToken('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session non trouvée</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/login')}
          >
            Retour au login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Configurer la double authentification
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Scannez ce QR code avec Google Authenticator ou Authy
        </p>

        <div className="space-y-6">
          <div className="flex justify-center">
            {qrCode && (
              <Image
                src={qrCode}
                alt="QR Code 2FA"
                width={200}
                height={200}
                className="border-2 border-gray-200 rounded-lg"
              />
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 text-center">
              Code secret (si vous ne pouvez pas scanner) :
            </p>
            <code className="block text-sm font-mono text-center break-all">
              {secret}
            </code>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              label="Code de vérification"
              className="text-center text-2xl tracking-widest"
              disabled={isVerifying}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={token.length !== 6 || isVerifying}
              loading={isVerifying}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Activer la 2FA
            </Button>
          </form>
        </div>
      </Card>

      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}