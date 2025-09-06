// src/app/login/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Notification } from '@/components/atoms/Notification/Notification';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

/**
 * LoginContent - Composant principal avec logique login
 */
function LoginContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  // Affichage message si redirection depuis route protégée
  useEffect(() => {
    if (returnUrl !== '/dashboard') {
      showNotification('info', 'Connexion requise pour accéder à cette page');
    }
  }, [returnUrl]);

  const showNotification = (type: NotificationState['type'], message: string): void => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = (): void => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleInputChange = (field: keyof LoginForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    if (errors[field]) {
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
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        showNotification('error', 'Email ou mot de passe incorrect');
      } else if (result?.ok) {
        showNotification('success', 'Connexion réussie ! Redirection...');
        setTimeout(() => {
          router.push(returnUrl);
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      showNotification('error', 'Erreur technique. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Notification */}
      <div className="fixed top-4 right-4 z-50">
        <Notification
          type={notification.type}
          message={notification.message}
          show={notification.show}
          onClose={hideNotification}
        />
      </div>

      {/* Container principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Card login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
              
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Connexion
                  </h1>
                  <p className="text-gray-600">
                    Accédez à votre dashboard ApoData Genesis
                  </p>
                  {returnUrl !== '/dashboard' && (
                    <p className="text-sm text-blue-600 mt-2">
                      Redirection vers : {decodeURIComponent(returnUrl)}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Formulaire */}
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                
                {/* Email */}
                <div>
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    iconLeft={<Mail className="w-4 h-4 text-gray-400" />}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                    iconLeft={<Lock className="w-4 h-4 text-gray-400" />}
                    iconRight={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  iconLeft={<LogIn className="w-4 h-4" />}
                  className="w-full"
                >
                  {isSubmitting ? 'Connexion...' : 'Se connecter'}
                </Button>

              </motion.form>

              {/* Lien retour accueil */}
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Link
                  href="/"
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour à l'accueil</span>
                </Link>
              </motion.div>

            </Card>
          </motion.div>

        </div>
      </div>
    </>
  );
}

/**
 * LoginPage - Page principale avec Suspense boundary
 */
export default function LoginPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 relative overflow-hidden">
      {/* Background animé */}
      <AnimatedBackground />
      
      {/* Contenu avec Suspense pour useSearchParams */}
      <Suspense 
        fallback={
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}