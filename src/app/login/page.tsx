// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Header } from '@/components/organisms/Header/Header';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Notification } from '@/components/atoms/Notification/Notification';
import { TwoFactorModal } from '@/components/molecules/TwoFactorModal/TwoFactorModal';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationState['type'], message: string): void => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = (): void => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleInputChange = (field: keyof LoginForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        if (result.error === '2FA_REQUIRED') {
          setPendingCredentials({
            email: formData.email,
            password: formData.password
          });
          setShow2FAModal(true);
        } else {
          showNotification('error', 'Email ou mot de passe incorrect');
        }
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      showNotification('error', 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FAVerify = async (token: string): Promise<void> => {
    if (!pendingCredentials) return;

    try {
      const result = await signIn('credentials', {
        email: pendingCredentials.email,
        password: pendingCredentials.password,
        token,
        redirect: false
      });

      if (result?.error) {
        if (result.error === 'INVALID_2FA_TOKEN') {
          showNotification('error', 'Code 2FA invalide');
        } else {
          showNotification('error', 'Erreur d\'authentification');
        }
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      showNotification('error', 'Erreur de vérification 2FA');
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Header />
      
      <main className="min-h-screen flex items-center justify-center px-4 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Connexion
              </h1>
              <p className="text-gray-600">
                Accédez à votre espace ApoData
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="votre@email.com"
                label="Email"
                error={errors.email}
                disabled={isSubmitting}
                iconLeft={<Mail className="w-5 h-5 text-gray-400" />}
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="••••••••"
                label="Mot de passe"
                error={errors.password}
                disabled={isSubmitting}
                iconLeft={<Lock className="w-5 h-5 text-gray-400" />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Se souvenir de moi
                  </span>
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {errors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <Button
                size="md"
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter
              </Button>
            </form>
          </Card>
        </motion.div>
      </main>

      <TwoFactorModal
        isOpen={show2FAModal}
        onVerify={handle2FAVerify}
        onClose={() => setShow2FAModal(false)}
        isLoading={isSubmitting}
      />

      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={hideNotification}
      />
    </>
  );
}