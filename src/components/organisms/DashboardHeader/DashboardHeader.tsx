// src/components/organisms/DashboardHeader/DashboardHeader.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge/Badge';

// Icons
const DashboardIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const PackageIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z" />
  </svg>
);

const FlaskIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5a2.25 2.25 0 00-.659 1.591v2.159A2.25 2.25 0 006.591 20.5h10.818a2.25 2.25 0 002.25-2.25v-2.159a2.25 2.25 0 00-.659-1.591l-4.091-4.091a2.25 2.25 0 01-.659-1.591V3.104a48.554 48.554 0 00-3.478 0z" />
  </svg>
);

const TagIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591L9.75 17.25c.621.621 1.621.621 2.242 0L19.5 9.742c.621-.621.621-1.621 0-2.242L13.409 1.409c-.621-.621-1.621-.621-2.242 0L3.659 8.909A2.25 2.25 0 003 10.5V5.25A2.25 2.25 0 015.25 3h4.318z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const LogOutIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

interface NavigationItem {
  readonly name: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly badgeVariant: 'gradient-blue' | 'gradient-green' | 'gradient-purple' | 'gradient-pink';
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon />, badgeVariant: 'gradient-blue' },
  { name: 'Produits', href: '/produits', icon: <PackageIcon />, badgeVariant: 'gradient-green' },
  { name: 'Laboratoires', href: '/laboratoires', icon: <FlaskIcon />, badgeVariant: 'gradient-purple' },
  { name: 'Catégories', href: '/categories', icon: <TagIcon />, badgeVariant: 'gradient-pink' },
];

interface DashboardHeaderProps {
  readonly className?: string;
}

/**
 * Dashboard Header - Header simple avec logo + badge + navigation
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
                    <ChevronDownIcon />
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
                      <LogOutIcon />
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
  );
};