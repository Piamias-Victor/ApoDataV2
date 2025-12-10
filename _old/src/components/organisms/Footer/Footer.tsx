// src/components/organisms/Footer/Footer.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/atoms/Badge/Badge';

interface FooterProps {
  readonly className?: string;
}

/**
 * Footer Component - Design minimal sticky avec compliance pharma
 * 
 * Liens légaux, support, version beta et mentions Phardev
 * Toujours visible en bas de page avec background identique au body
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { name: 'CGU', href: '#cgu' },
    { name: 'Confidentialité', href: '#privacy' },
    { name: 'RGPD', href: '#gdpr' },
  ];

  const supportLinks = [
    { name: 'Contact', href: '#contact' },
    { name: 'Aide', href: '#help' },
    { name: 'Documentation', href: '#docs' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleLinkClick = (href: string): void => {
    console.log(`Navigation vers: ${href}`);
    // TODO: Implémenter navigation réelle
  };

  return (
    <motion.footer
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-gray-50 border-t border-gray-200
        ${className}
      `}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
    >
      <div className="container-apodata">
        <div className="py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Gauche - Liens légaux */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                {legalLinks.map((link, index) => (
                  <React.Fragment key={link.name}>
                    <motion.button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {link.name}
                    </motion.button>
                    {index < legalLinks.length - 1 && (
                      <span className="text-gray-300">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center space-x-4">
                {supportLinks.map((link, index) => (
                  <React.Fragment key={link.name}>
                    <motion.button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {link.name}
                    </motion.button>
                    {index < supportLinks.length - 1 && (
                      <span className="text-gray-300">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Droite - Version, Copyright, Phardev */}
            <div className="flex items-center space-x-4">
              <Badge variant="beta" size="xs">
                v2.1.0-beta
              </Badge>
              <span className="text-xs text-gray-400">
                © {currentYear} Phardev
              </span>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            {/* Première ligne - Liens principaux */}
            <div className="flex items-center justify-center space-x-4">
              {[...legalLinks.slice(0, 3), ...supportLinks.slice(0, 2)].map((link, index) => (
                <React.Fragment key={link.name}>
                  <motion.button
                    onClick={() => handleLinkClick(link.href)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {link.name}
                  </motion.button>
                  {index < 4 && <span className="text-gray-300">•</span>}
                </React.Fragment>
              ))}
            </div>

            {/* Deuxième ligne - Version et Copyright */}
            <div className="flex items-center justify-center space-x-3">
              <Badge variant="beta" size="xs">
                v2.1.0-beta
              </Badge>
              <span className="text-xs text-gray-400">
                © {currentYear} Phardev
              </span>
            </div>

            {/* Troisième ligne - Support restant */}
            <div className="flex items-center justify-center space-x-4">
              {supportLinks.slice(2).map((link, index) => (
                <React.Fragment key={link.name}>
                  <motion.button
                    onClick={() => handleLinkClick(link.href)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {link.name}
                  </motion.button>
                  {index < supportLinks.slice(2).length - 1 && (
                    <span className="text-gray-300">•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};