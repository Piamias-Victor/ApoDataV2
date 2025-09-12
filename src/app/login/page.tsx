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
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field !== 'rememberMe' && errors[field as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    hideNotification();
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        showNotification('error', 'Email ou mot de passe incorrect.');
        setErrors({ general: 'Identifiants incorrects' });
      } else if (result?.ok) {
        showNotification('success', 'Connexion réussie ! Redirection...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        showNotification('error', 'Une erreur inattendue est survenue.');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      showNotification('error', 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <AnimatedBackground />
      <Header />
      
      {/* CORRECTION: Utiliser 'show' au lieu de 'visible' et retirer autoClose/duration */}
      <Notification
        type={notification.type}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
      />
      
      <main className="relative z-10 pt-16 pb-20">
        <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            
            <div className='mb-4'>
              <Link 
                href="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </div>

            <Card variant="elevated" padding="xl">
              <div className="space-y-6">
                
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Se connecter
                  </h1>
                  <p className="text-gray-600">
                    Accédez à votre dashboard ApoData
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <Input
                    variant="default"
                    size="lg"
                    label="Email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    iconLeft={<Mail />}
                    disabled={isSubmitting}
                    required
                  />

                  <Input
                    variant="default"
                    size="lg"
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                    iconLeft={<Lock />}
                    iconRight={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    }
                    disabled={isSubmitting}
                    required
                  />

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange('rememberMe')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
                        Se souvenir de moi
                      </label>
                    </div>
                    
                    <Link 
                      href="/auth/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Error général */}
                  {errors.general && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{errors.general}</p>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    fullWidth
                    loading={isSubmitting}
                    loadingText="Connexion..."
                    iconRight={<LogIn />}
                    disabled={isSubmitting}
                  >
                    Se connecter
                  </Button>

                </form>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Connexion sécurisée • Données chiffrées • Conformité RGPD
                  </p>
                </div>

              </div>
            </Card>

          </motion.div>
        </div>
      </main>
    </div>
  );
}