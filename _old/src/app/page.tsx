// src/app/page.tsx
import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Header } from '@/components/organisms/Header/Header';
import { Footer } from '@/components/organisms/Footer/Footer';
import { HeroSection } from '@/components/organisms/HeroSection/HeroSection';
import { DashboardFeaturesSection } from '@/components/organisms/DashboardFeaturesSection/DashboardFeaturesSection';
import { AboutSection } from '@/components/organisms/AboutSection/AboutSection';

/**
 * HomePage - Page d'accueil avec Header sticky et Footer
 * 
 * Layout principal avec header glass effect sticky, 
 * hero section, features dashboard, about section et footer fixe
 */
export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header sticky */}
      <Header />
      
      {/* Contenu principal avec padding pour header/footer */}
      <main className="relative z-10 pt-16 pb-20">
        {/* Hero Section */}
        <section id="home" className="min-h-screen flex items-center justify-center">
          <HeroSection />
        </section>

        {/* Dashboard Features Section */}
        <section id="dashboard" className="min-h-screen flex items-center justify-center bg-white/30">
          <DashboardFeaturesSection />
        </section>

        {/* About Section */}
        <section id="about" className="min-h-screen flex items-center justify-center">
          <AboutSection />
        </section>

      </main>
      
      {/* Footer sticky */}
      <Footer />
    </div>
  );
}