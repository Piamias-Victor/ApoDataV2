// src/components/organisms/Header/Header.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';

// Icons nécessaires
const MenuIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const DashboardIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const LogOutIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const HomeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

interface NavigationItem {
  readonly name: string;
  readonly href: string;
  readonly icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  { name: 'Accueil', href: '#home', icon: <HomeIcon /> },
  { name: 'À propos', href: '#about', icon: <InfoIcon /> },
];

interface HeaderProps {
  readonly className?: string;
}

/**
 * Header Component - Authentification NextAuth intégrée avec design amélioré
 */
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const scrollToSection = (href: string): void => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleDashboardAccess = (): void => {
    router.push('/dashboard');
    setUserMenuOpen(false);
  };

  const handleLogout = async (): Promise<void> => {
    await signOut({ callbackUrl: '/' });
    setUserMenuOpen(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'gradient-purple';
      case 'user': return 'gradient-blue';
      case 'viewer': return 'gradient-green';
      default: return 'gray';
    }
  };

  return (
    <motion.header
      className={`
        fixed top-0 left-0 right-0 z-50 
        bg-white/80 backdrop-blur-xl border-b border-white/20
        shadow-soft transition-all duration-300
        ${className}
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="container-apodata">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ApoData
              </h1>
            </motion.div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="
                  flex items-center space-x-2 px-3 py-2 rounded-lg
                  text-gray-700 hover:text-blue-600
                  transition-colors duration-200
                "
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="w-4 h-4">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </motion.button>
            ))}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="
                    relative bg-white/80 backdrop-blur-xl border border-white/20
                    rounded-lg px-4 py-2.5 min-h-[44px]
                    hover:bg-white/90 hover:shadow-soft hover:border-gray-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    transition-all duration-200 ease-out
                    flex items-center space-x-3
                  "
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* User Info Container */}
                  <div className="flex items-center space-x-3">
                    {/* User Icon with subtle background */}
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon />
                    </div>
                    
                    {/* User Details */}
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900 leading-none">
                        {session.user.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-none">
                        {session.user.pharmacyName || 'Admin'}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Arrow */}
                  <motion.div
                    animate={{ rotate: userMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 text-gray-400"
                  >
                    <ChevronDownIcon />
                  </motion.div>
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      
                      <motion.div
                        className="
                          absolute right-0 mt-2 w-72 z-50
                          bg-white/90 backdrop-blur-xl rounded-xl 
                          shadow-strong border border-white/20
                          overflow-hidden
                        "
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        {/* User Info Header */}
                        <div className="p-4 border-b border-gray-100/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <UserIcon />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {session.user.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {session.user.email}
                              </div>
                              <div className="mt-1">
                                <Badge 
                                  variant={getRoleBadgeVariant(session.user.role)} 
                                  size="xs"
                                >
                                  {session.user.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {session.user.pharmacyName && (
                            <div className="mt-3 pt-3 border-t border-gray-100/50">
                              <div className="text-xs text-gray-500">Pharmacie</div>
                              <div className="text-sm font-medium text-gray-900">
                                {session.user.pharmacyName}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Menu Actions */}
                        <div className="p-2 space-y-1">
                          <motion.button
                            onClick={handleDashboardAccess}
                            className="
                              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                              text-gray-700 hover:bg-gray-100 hover:text-blue-600
                              transition-colors duration-200 text-left
                            "
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="w-4 h-4 flex-shrink-0">
                              <DashboardIcon />
                            </span>
                            <span className="text-sm font-medium">
                              Accéder au Dashboard
                            </span>
                          </motion.button>
                          
                          <motion.button
                            onClick={handleLogout}
                            className="
                              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                              text-gray-700 hover:bg-red-50 hover:text-red-600
                              transition-colors duration-200 text-left
                            "
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="w-4 h-4 flex-shrink-0">
                              <LogOutIcon />
                            </span>
                            <span className="text-sm font-medium">
                              Se déconnecter
                            </span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Connexion
                </Button>
              </Link>
            )}
          </div>

          {/* Menu Burger Mobile */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              onClick={toggleMobileMenu}
            />
          </div>
        </div>

        {/* Menu Mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-white/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="py-4 space-y-2">
                {/* Navigation Mobile */}
                {navigationItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                      text-gray-700 hover:bg-white/50 hover:text-blue-600
                      transition-colors duration-200 text-left
                    "
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="w-5 h-5">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </motion.button>
                ))}

                {/* Actions Mobile */}
                <div className="pt-4 border-t border-white/20 space-y-2">
                  {session?.user ? (
                    <>
                      <div className="px-4 py-3 bg-white/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {session.user.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {session.user.email}
                            </div>
                          </div>
                          <Badge 
                            variant={getRoleBadgeVariant(session.user.role)} 
                            size="xs"
                          >
                            {session.user.role}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        iconLeft={<DashboardIcon />}
                        onClick={handleDashboardAccess}
                      >
                        Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        fullWidth
                        iconLeft={<LogOutIcon />}
                        onClick={handleLogout}
                      >
                        Déconnexion
                      </Button>
                    </>
                  ) : (
                    <Link href="/login">
                      <Button variant="primary" size="md" fullWidth>
                        Connexion
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};