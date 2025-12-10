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
  GitCompareArrows,
  Loader2,
  Building2,
  Handshake,
  Pill,
  TrendingUp,
  Boxes,
  ShieldMinus,
  FileSpreadsheet
} from 'lucide-react';

interface NavigationItem {
  readonly name: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly badgeVariant: 'gradient-blue' | 'gradient-green' | 'gradient-purple' | 'gradient-pink' | 'gradient-orange';
}

interface NavigationGroup {
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    name: 'Analyse',
    icon: <TrendingUp className="w-4 h-4" />,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, badgeVariant: 'gradient-blue' },
      { name: 'Comparaison', href: '/comparaisons', icon: <GitCompareArrows className="w-4 h-4" />, badgeVariant: 'gradient-purple' },
      { name: 'Comparaison Pharma', href: '/comparaisons-pharmacie', icon: <Building2 className="w-4 h-4" />, badgeVariant: 'gradient-green' }
    ]
  },
  {
    name: 'Commerce',
    icon: <ShoppingCart className="w-4 h-4" />,
    items: [
      { name: 'Ventes', href: '/ventes', icon: <ShoppingCart className="w-4 h-4" />, badgeVariant: 'gradient-green' },
      { name: 'Prix', href: '/prix', icon: <Euro className="w-4 h-4" />, badgeVariant: 'gradient-purple' },
      { name: 'Négociation', href: '/pricing', icon: <Handshake className="w-4 h-4" />, badgeVariant: 'gradient-pink' }
    ]
  },
  {
    name: 'Gestion',
    icon: <Boxes className="w-4 h-4" />,
    items: [
      { name: 'Stock', href: '/stock', icon: <Package2 className="w-4 h-4" />, badgeVariant: 'gradient-pink' },
      { name: 'Rupture', href: '/ruptures', icon: <ShieldMinus className="w-4 h-4" />, badgeVariant: 'gradient-pink' },
      { name: 'Générique', href: '/generique', icon: <Pill className="w-4 h-4" />, badgeVariant: 'gradient-blue' },
      { name: 'Pharmacies', href: '/pharmacies', icon: <Building2 className="w-4 h-4" />, badgeVariant: 'gradient-green' },
      { name: 'Declaration BRI', href: '/declaration-bri', icon: <FileSpreadsheet className="w-4 h-4" />, badgeVariant: 'gradient-purple' },
      { name: 'Hausse Tarifaire', href: '/hausse-tarifaire', icon: <TrendingUp className="w-4 h-4" />, badgeVariant: 'gradient-orange' }
    ]
  }
];

interface DashboardHeaderProps {
  readonly className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ className = '' }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleNavigation = async (href: string): Promise<void> => {
    if (pathname === href) return;

    try {
      setIsNavigating(true);
      setTargetRoute(href);
      setIsMobileMenuOpen(false);
      setActiveDropdown(null);

      await router.prefetch(href);
      router.push(href);

      setTimeout(() => {
        setIsNavigating(false);
        setTargetRoute(null);
      }, 5000);

    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
      setTargetRoute(null);
    }
  };

  React.useEffect(() => {
    setIsNavigating(false);
    setTargetRoute(null);
  }, [pathname]);

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

  // Vérifier si un item du groupe est actif
  const isGroupActive = (group: NavigationGroup): boolean => {
    return group.items.some(item =>
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
  };

  // Obtenir l'item actif d'un groupe
  const getActiveItemInGroup = (group: NavigationGroup): NavigationItem | undefined => {
    return group.items.find(item =>
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
  };

  return (
    <>
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

            {/* Navigation Desktop avec Groupes */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigationGroups.map((group) => {
                const groupActive = isGroupActive(group);
                const activeItem = getActiveItemInGroup(group);
                const isOpen = activeDropdown === group.name;

                return (
                  <div key={group.name} className="relative">
                    <motion.button
                      onClick={() => setActiveDropdown(isOpen ? null : group.name)}
                      onMouseEnter={() => {
                        group.items.forEach(item => router.prefetch(item.href));
                      }}
                      disabled={isNavigating}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg
                        transition-all duration-200 relative
                        ${groupActive
                          ? 'text-blue-600 bg-blue-50 border border-blue-200'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }
                        ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      whileHover={!isNavigating ? { scale: 1.02 } : {}}
                      whileTap={!isNavigating ? { scale: 0.98 } : {}}
                    >
                      {group.icon}
                      <span className="text-sm font-medium">{group.name}</span>
                      {groupActive && activeItem && (
                        <span className="text-xs text-blue-500 ml-1">
                          • {activeItem.name}
                        </span>
                      )}
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </motion.div>
                    </motion.button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveDropdown(null)}
                          />
                          <motion.div
                            className="
                              absolute top-full mt-2 w-56 z-50
                              bg-white/95 backdrop-blur-xl rounded-xl 
                              shadow-xl border border-gray-100
                              overflow-hidden
                            "
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          >
                            <div className="p-1">
                              {group.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const isLoadingThis = isNavigating && targetRoute === item.href;

                                return (
                                  <motion.button
                                    key={item.name}
                                    onClick={() => handleNavigation(item.href)}
                                    disabled={isNavigating}
                                    className={`
                                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                                      transition-colors duration-200 text-left
                                      ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                      }
                                      ${isNavigating ? 'opacity-50' : ''}
                                    `}
                                    whileHover={!isNavigating ? { x: 2 } : {}}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {isLoadingThis ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      item.icon
                                    )}
                                    <span className="text-sm font-medium">{item.name}</span>
                                    {isActive && (
                                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
                            {session.user.role === 'admin' && (
                              <motion.button
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  handleNavigation('/admin/pharmacies');
                                }}
                                className="
                                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                                  text-gray-700 hover:bg-blue-50 hover:text-blue-600
                                  transition-colors duration-200 text-left
                                "
                                whileHover={{ x: 2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <span className="w-4 h-4 flex-shrink-0">
                                  <Building2 className="w-full h-full" />
                                </span>
                                <span className="text-sm font-medium">
                                  Gérer les comptes
                                </span>
                              </motion.button>
                            )}

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

          {/* Menu Mobile avec Groupes */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="md:hidden border-t border-white/20"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="py-4 space-y-4">
                  {navigationGroups.map((group) => {
                    const groupActive = isGroupActive(group);

                    return (
                      <div key={group.name} className="px-4">
                        <div className="flex items-center space-x-2 mb-2">
                          {group.icon}
                          <h3 className={`
                            text-xs font-semibold uppercase tracking-wider
                            ${groupActive ? 'text-blue-600' : 'text-gray-500'}
                          `}>
                            {group.name}
                          </h3>
                        </div>
                        <div className="space-y-1 pl-6">
                          {group.items.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const isLoadingThis = isNavigating && targetRoute === item.href;

                            return (
                              <motion.button
                                key={item.name}
                                onClick={() => handleNavigation(item.href)}
                                disabled={isNavigating}
                                className={`
                                  w-full flex items-center space-x-3 px-3 py-2 rounded-lg
                                  transition-colors duration-200 text-left
                                  ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                  }
                                  ${isNavigating ? 'opacity-50' : ''}
                                `}
                                whileHover={!isNavigating ? { x: 2 } : {}}
                              >
                                {isLoadingThis ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  item.icon
                                )}
                                <span className="text-sm font-medium">{item.name}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* User Actions Mobile */}
                  {session?.user && (
                    <div className="pt-4 border-t border-white/20 space-y-2 px-4">
                      <div className="py-3 bg-white/50 rounded-lg px-3">
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

                      {session.user.role === 'admin' && (
                        <motion.button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleNavigation('/admin/pharmacie');
                          }}
                          className="
                            w-full flex items-center space-x-3 px-3 py-2 rounded-lg
                            text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-left
                          "
                          whileHover={{ x: 4 }}
                        >
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Gérer les comptes</span>
                        </motion.button>
                      )}

                      <motion.button
                        onClick={handleLogout}
                        className="
                          w-full flex items-center space-x-3 px-3 py-2 rounded-lg
                          text-red-600 hover:bg-red-50 transition-colors duration-200 text-left
                        "
                        whileHover={{ x: 4 }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Se déconnecter</span>
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

      {/* Loading Overlay - En dehors du header pour un positionnement correct */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-md mx-4"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="text-center">
                <div className="mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chargement en cours...
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed">
                  Vos données seront disponibles dans quelques instants.
                </p>

                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};