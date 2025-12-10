// src/providers/PharmacyProvider.tsx
'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface PharmacyProviderProps {
  readonly children: React.ReactNode;
}

/**
 * PharmacyProvider - Auto-injection sécurisée du filtre pharmacie
 * 
 * Logique :
 * - Admin: unlock pharmacy filter (drawer disponible)
 * - User: lock pharmacy filter avec son pharmacy_id (pas de drawer)
 * - Viewer: lock pharmacy filter avec son pharmacy_id (pas de drawer)
 * 
 * Sécurité :
 * - Injection une seule fois au montage
 * - Protection contre tampering localStorage
 * - Cleanup au logout
 */
export const PharmacyProvider: React.FC<PharmacyProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const { lockPharmacyFilter, unlockPharmacyFilter, isPharmacyLocked, pharmacy } = useFiltersStore();
  
  const hasInitialized = React.useRef(false);
  const lastSessionId = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Skip if loading or no session
    if (status === 'loading' || !session?.user) {
      return;
    }

    const currentSessionId = session.user.id;
    const userRole = session.user.role;
    const pharmacyId = session.user.pharmacyId;

    // Détection changement de session (logout/login)
    const isNewSession = lastSessionId.current !== currentSessionId;
    lastSessionId.current = currentSessionId;

    // Reset sur nouvelle session ou première init
    if (isNewSession || !hasInitialized.current) {
      hasInitialized.current = true;

      if (userRole === 'admin') {
        // Admin: unlock pour permettre sélection multiple
        unlockPharmacyFilter();
        console.log('🔓 Admin detected - pharmacy filter unlocked');
      } else {
        // User/Viewer: lock avec leur pharmacie
        if (pharmacyId) {
          lockPharmacyFilter(pharmacyId);
          console.log(`🔒 User/Viewer detected - pharmacy filter locked to: ${pharmacyId}`);
        } else {
          console.error('❌ User/Viewer without pharmacy_id - security issue');
        }
      }
    }

    // Vérification sécurité continue pour users
    if (userRole !== 'admin' && pharmacyId) {
      const currentPharmacyFilter = pharmacy;
      const isValidState = isPharmacyLocked && 
        currentPharmacyFilter.length === 1 && 
        currentPharmacyFilter[0] === pharmacyId;

      if (!isValidState) {
        // Re-lock en cas de tampering
        console.warn('🚨 Security check failed - re-locking pharmacy filter');
        lockPharmacyFilter(pharmacyId);
      }
    }
  }, [session, status, lockPharmacyFilter, unlockPharmacyFilter, isPharmacyLocked, pharmacy]);

  // Cleanup au logout
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      hasInitialized.current = false;
      lastSessionId.current = null;
      unlockPharmacyFilter();
      console.log('👋 Logout detected - pharmacy filter unlocked');
    }
  }, [status, unlockPharmacyFilter]);

  return <>{children}</>;
};