// src/app/auth/forgot-password/page.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Notification } from '@/components/atoms/Notification/Notification';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

interface ForgotPasswordForm {
  email: string;
}

interface ForgotPasswordErrors {
  email?: string;
  general?: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function ForgotPasswordPage(): JSX.Element {
  const [formData, setFormData] = useState<ForgotPasswordForm>({
    email: ''
  });

  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    
    setFormData(prev => ({
      ...prev,
      email: value
    }));
    
    // Clear error when user starts typing - CORRECTION TYPESCRIPT
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.email) {
        delete newErrors.email;
      }
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: ForgotPasswordErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        showNotification('success', 'Email de réinitialisation envoyé avec succès !');
      } else {
        showNotification('error', data.error || 'Erreur lors de l\'envoi');
        setErrors({ general: data.error });
      }
    } catch (error) {
      console.error('Erreur forgot password:', error);
      showNotification('error', 'Erreur technique. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <AnimatedBackground />
        
        <Notification
          type={notification.type}
          message={notification.message}
          show={notification.show}
          onClose={hideNotification}
        />
        
        <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <Card variant="elevated" padding="xl">
              <div className="text-center space-y-6">
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>

                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Email envoyé !
                  </h1>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Un lien de réinitialisation a été envoyé à :
                    </p>
                    <p className="font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      {formData.email}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
                  <h3 className="font-medium text-gray-900">Instructions :</h3>
                  <ul className="space-y-1 text-left">
                    <li>• Vérifiez votre boîte de réception</li>
                    <li>• Cliquez sur le lien dans l'email</li>
                    <li>• Le lien expire dans 1 heure</li>
                    <li>• Vérifiez vos spams si besoin</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-4">
                  <Link href="/login">
                    <Button variant="primary" size="lg" fullWidth>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour à la connexion
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    size="md" 
                    onClick={() => {
                      setEmailSent(false);
                      setFormData({ email: '' });
                      setErrors({});
                      hideNotification();
                    }}
                  >
                    Changer d'email
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <AnimatedBackground />
      
      <Notification
        type={notification.type}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
      />
      
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          
          <div className="mb-6">
            <Link 
              href="/login"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Card variant="elevated" padding="xl">
              <div className="space-y-6">
                
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Mot de passe oublié
                  </h1>
                  <p className="text-gray-600">
                    Saisissez votre email pour recevoir un lien de réinitialisation
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <Input
                    variant="default"
                    size="lg"
                    label="Votre adresse email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email || errors.general}
                    iconLeft={<Mail />}
                    disabled={isSubmitting}
                    required
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    fullWidth
                    loading={isSubmitting}
                    loadingText="Envoi en cours..."
                    iconRight={<Send />}
                  >
                    Envoyer le lien
                  </Button>

                </form>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Le lien sera valide pendant 1 heure • Connexion sécurisée
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