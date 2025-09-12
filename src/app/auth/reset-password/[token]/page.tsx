// src/app/auth/reset-password/[token]/page.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Notification } from '@/components/atoms/Notification/Notification';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ResetPasswordPageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps): JSX.Element {
  const router = useRouter();
  const { token } = params;

  const [formData, setFormData] = useState<ResetPasswordForm>({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
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

  const handleInputChange = (field: keyof ResetPasswordForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validatePassword = (password: string): string[] => {
    const issues: string[] = [];
    
    if (password.length < 8) issues.push('Minimum 8 caractères');
    if (!/[A-Z]/.test(password)) issues.push('Une majuscule requise');
    if (!/[a-z]/.test(password)) issues.push('Une minuscule requise');
    if (!/[0-9]/.test(password)) issues.push('Un chiffre requis');
    if (!/[^A-Za-z0-9]/.test(password)) issues.push('Un caractère spécial requis');
    
    return issues;
  };

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordErrors = {};
    
    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else {
      const passwordIssues = validatePassword(formData.password);
      if (passwordIssues.length > 0) {
        newErrors.password = passwordIssues.join(', ');
      }
    }
    
    // Validation confirmation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        showNotification('success', 'Mot de passe réinitialisé avec succès !');
      } else {
        if (data.details && Array.isArray(data.details)) {
          // Erreurs de validation détaillées
          const newErrors: ResetPasswordErrors = {};
          data.details.forEach((detail: any) => {
            if (detail.field) {
              newErrors[detail.field as keyof ResetPasswordErrors] = detail.message;
            }
          });
          setErrors(newErrors);
        }
        showNotification('error', data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      showNotification('error', 'Erreur technique. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (): { level: number; text: string; color: string } => {
    const issues = validatePassword(formData.password);
    const strength = Math.max(0, 5 - issues.length);
    
    if (strength === 0) return { level: 0, text: 'Très faible', color: 'bg-red-500' };
    if (strength <= 2) return { level: strength, text: 'Faible', color: 'bg-orange-500' };
    if (strength <= 3) return { level: strength, text: 'Moyen', color: 'bg-yellow-500' };
    if (strength <= 4) return { level: strength, text: 'Bon', color: 'bg-blue-500' };
    return { level: strength, text: 'Excellent', color: 'bg-green-500' };
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <AnimatedBackground />
        
        {/* CORRECTION: Retirer autoClose et duration */}
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
                    Mot de passe réinitialisé !
                  </h1>
                  <p className="text-gray-600">
                    Votre nouveau mot de passe a été configuré avec succès. 
                    Vous pouvez maintenant vous connecter.
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth
                    onClick={() => router.push('/login')}
                  >
                    Se connecter maintenant
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* CORRECTION: Retirer autoClose et duration */}
      <Notification
        type={notification.type}
        message={notification.message}
        show={notification.show}
        onClose={hideNotification}
      />
      
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          
          {/* Lien retour */}
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
                
                {/* Header */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Nouveau mot de passe
                  </h1>
                  <p className="text-gray-600">
                    Créez un mot de passe fort pour sécuriser votre compte
                  </p>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Nouveau mot de passe */}
                  <div>
                    <Input
                      variant="default"
                      size="lg"
                      label="Nouveau mot de passe"
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
                    
                    {/* Force du mot de passe */}
                    {formData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Force :</span>
                          <span className={`font-medium ${
                            passwordStrength.level <= 2 ? 'text-red-600' :
                            passwordStrength.level <= 3 ? 'text-yellow-600' :
                            passwordStrength.level <= 4 ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.level / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmation mot de passe */}
                  <Input
                    variant="default"
                    size="lg"
                    label="Confirmer le mot de passe"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    error={errors.confirmPassword}
                    iconLeft={<Lock />}
                    iconRight={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="cursor-pointer hover:text-gray-600 transition-colors duration-200"
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    }
                    disabled={isSubmitting}
                    required
                  />

                  {/* Exigences mot de passe */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Exigences du mot de passe :
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formData.password.length >= 8 ? '✓' : '○'}
                        </span>
                        Minimum 8 caractères
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Une lettre majuscule
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[a-z]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Une lettre minuscule
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[0-9]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Un chiffre
                      </li>
                      <li className="flex items-center">
                        <span className={`mr-2 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                          {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Un caractère spécial (!@#$%^&*)
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    fullWidth
                    loading={isSubmitting}
                    loadingText="Réinitialisation..."
                    disabled={passwordStrength.level < 4} // Minimum "Bon"
                  >
                    Réinitialiser le mot de passe
                  </Button>

                </form>

                {/* Info sécurité */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Connexion sécurisée • Mot de passe chiffré • Audit trail
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