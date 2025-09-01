// src/components/organisms/DashboardHeader/DashboardHeader.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge/Badge';
import { FilterBar } from '@/components/organisms/FilterBar/FilterBar';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Euro, 
  Package2, 
  ChevronDown, 
  LogOut, 
  GitCompareArrows
} from 'lucide-react';

interface NavigationItem {
  readonly name: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly badgeVariant: 'gradient-blue' | 'gradient-green' | 'gradient-purple' | 'gradient-pink';
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-full h-full" />, badgeVariant: 'gradient-blue' },
  { name: 'Ventes', href: '/ventes', icon: <ShoppingCart className="w-full h-full" />, badgeVariant: 'gradient-green' },
  { name: 'Prix', href: '/prix', icon: <Euro className="w-full h-full" />, badgeVariant: 'gradient-purple' },
  { name: 'Stock', href: '/stock', icon: <Package2 className="w-full h-full" />, badgeVariant: 'gradient-pink' },
  { name: 'Comparaison', href: '/comparaisons', icon: <GitCompareArrows  className="w-full h-full" />, badgeVariant: 'gradient-pink' },
];

interface DashboardHeaderProps {
  readonly className?: string;
}

/**
 * Dashboard Header - Header avec FilterBar intégrée
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = '' }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleNavigation = (href: string): void => {
    router.push(href);
    setIsMobileMenuOpen(false);
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
    <>
      {/* Header Principal */}
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
            <div className="flex items-center">
              <motion.div
                className="flex items-center cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ApoData
                </h1>
              </motion.div>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${pathname === item.href || pathname.startsWith(item.href + '/') 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600'
                    }
                  `}
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
              {session?.user && (
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
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900 leading-none">
                        {session.user.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-none">
                        {session.user.pharmacyName || 'Admin'}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: userMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-4 h-4 text-gray-400"
                    >
                      <ChevronDown className="w-full h-full" />
                    </motion.div>
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
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
                          <div className="p-4 border-b border-gray-100/50">
                            <div className="flex items-center space-x-3">
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
                          
                          <div className="p-2">
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
                                <LogOut className="w-full h-full" />
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
              )}
            </div>

            {/* Menu Mobile */}
            <div className="md:hidden flex items-center">
              <motion.button
                onClick={toggleMobileMenu}
                className="p-2"
                whileTap={{ scale: 0.95 }}
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </motion.button>
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
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                        transition-colors duration-200 text-left
                        ${pathname === item.href || pathname.startsWith(item.href + '/') 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-white/50 hover:text-blue-600'
                        }
                      `}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="w-5 h-5">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </motion.button>
                  ))}

                  {/* User Actions Mobile */}
                  {session?.user && (
                    <div className="pt-4 border-t border-white/20 space-y-2">
                      <div className="px-4 py-3 bg-white/50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-900">
                          {session.user.name}
                        </div>
                        <div className="text-xs text-gray-500">
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
                      <motion.button
                        onClick={handleLogout}
                        className="
                          w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                          text-red-600 hover:bg-red-50 transition-colors duration-200 text-left
                        "
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Se déconnecter</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Filter Bar */}
      <FilterBar />
    </>
  );
};