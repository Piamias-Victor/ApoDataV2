// src/components/organisms/AboutSection/AboutSection.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Badge } from '@/components/atoms/Badge/Badge';
import { User, Mail, Send } from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface AboutSectionProps {
  readonly className?: string;
}

/**
 * About Section - Présentation Phardev avec formulaire de contact
 * 
 * Split 60/40 avec contenu accessible/humain côté gauche
 * et formulaire de contact avec validation temps réel côté droit
 */
export const AboutSection: React.FC<AboutSectionProps> = ({ className = '' }) => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ContactForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ContactErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nom requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nom trop court';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message requis';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message trop court (min. 10 caractères)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // TODO: Implement actual form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Form submitted:', formData);
      
      // Reset form on success
      setFormData({ name: '', email: '', message: '' });
      alert('Message envoyé avec succès !');
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`py-20 px-4 ${className}`}>
      <div className="container-apodata">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            À propos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            L'alliance parfaite entre expertise technique et connaissance du milieu pharmaceutique
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Left Content - 60% */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-3 space-y-8"
          >
            
            {/* Phardev Introduction */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  Phardev
                </h3>
                <Badge variant="gradient-blue" size="md">
                  Expertise Pharma
                </Badge>
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Chez Phardev, nous ne sommes pas que des développeurs. Nous sommes des spécialistes 
                qui comprennent vraiment les défis quotidiens des pharmaciens. Notre équipe combine 
                une expertise technique de pointe avec une connaissance approfondie du secteur pharmaceutique.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Cette double compétence nous permet de créer des solutions qui ne sont pas seulement 
                techniquement excellentes, mais qui répondent vraiment aux besoins concrets 
                de votre officine.
              </p>
            </div>

            {/* Philosophie */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Notre Philosophie
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <strong className="text-gray-900">Simplicité d'abord :</strong> Fini les interfaces complexes. 
                    Nous croyons qu'un outil puissant peut être simple à utiliser.
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <strong className="text-gray-900">Fiabilité totale :</strong> Des données sécurisées 
                    et une stabilité à toute épreuve pour votre activité quotidienne.
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <strong className="text-gray-900">Maîtrise totale :</strong> Vos données vous appartiennent. 
                    Reprenez le contrôle avec des outils pensés pour vous.
                  </p>
                </div>
              </div>
            </div>
            
          </motion.div>

          {/* Right Content - Contact Form 40% */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="lg:col-span-2"
          >
            <Card variant="elevated" padding="lg" className="sticky top-24">
              <div className="space-y-6">
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Contactez-nous
                  </h3>
                  <p className="text-gray-600">
                    Une question ? Un projet ? Parlons-en !
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    variant="default"
                    size="md"
                    label="Nom complet"
                    type="text"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={errors.name}
                    iconLeft={<User />}
                    required
                  />

                  <Input
                    variant="default"
                    size="md"
                    label="Email"
                    type="email"
                    placeholder="jean.dupont@pharmacie.fr"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    iconLeft={<Mail />}
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Message
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <motion.textarea
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      placeholder="Décrivez votre projet ou votre question..."
                      rows={4}
                      className={`
                        w-full px-4 py-3 text-sm rounded-lg border border-gray-300
                        bg-white text-gray-900 placeholder:text-gray-400
                        hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        focus:outline-none transition-all duration-200 ease-in-out
                        resize-none
                        ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                      `}
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    />
                    {errors.message && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600"
                      >
                        {errors.message}
                      </motion.p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    fullWidth
                    loading={isSubmitting}
                    loadingText="Envoi en cours..."
                    iconRight={<Send />}
                  >
                    Nous contacter
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Nous vous répondrons dans les 24h ouvrées
                  </p>
                </div>
                
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
};