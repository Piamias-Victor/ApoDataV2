// src/lib/api-security.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface SecureFilters {
  readonly products?: string[];
  readonly laboratories?: string[];
  readonly categories?: string[];
  readonly pharmacy?: string[];
  readonly dateRange?: {
    readonly start: string | null;
    readonly end: string | null;
  };
}

export interface SecurityContext {
  readonly userId: string;
  readonly userRole: 'admin' | 'user' | 'viewer';
  readonly pharmacyId: string | null;
  readonly isAdmin: boolean;
}

/**
 * Sécurité API - Validation et auto-filtrage par pharmacie
 * 
 * Fonctions :
 * - getSecurityContext: extrait infos sécurité session
 * - enforcePharmacySecurity: force filtre pharmacie pour users
 * - validatePharmacyAccess: vérifie cohérence filtres vs droits
 * 
 * Usage dans toutes les API routes qui manipulent data pharmacie
 */

export async function getSecurityContext(): Promise<SecurityContext | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    return {
      userId: session.user.id,
      userRole: session.user.role,
      pharmacyId: session.user.pharmacyId,
      isAdmin: session.user.role === 'admin',
    };
  } catch (error) {
    console.error('Security context error:', error);
    return null;
  }
}

export function enforcePharmacySecurity(
  filters: SecureFilters,
  context: SecurityContext
): SecureFilters {
  // Admin: no restrictions
  if (context.isAdmin) {
    return filters;
  }

  // User/Viewer: force leur pharmacie uniquement
  if (context.pharmacyId) {
    return {
      ...filters,
      pharmacy: [context.pharmacyId], // Override toujours
    };
  }

  // User sans pharmacie = erreur sécurité
  throw new Error('User without pharmacy access detected');
}

export function validatePharmacyAccess(
  requestedPharmacyIds: string[],
  context: SecurityContext
): boolean {
  // Admin: accès total
  if (context.isAdmin) {
    return true;
  }

  // User/Viewer: seulement leur pharmacie
  if (context.pharmacyId) {
    return requestedPharmacyIds.length === 1 && 
           requestedPharmacyIds[0] === context.pharmacyId;
  }

  return false;
}

export function buildSecurePharmacyFilter(context: SecurityContext): string {
  if (context.isAdmin) {
    return ''; // Pas de restriction WHERE
  }

  if (context.pharmacyId) {
    return `AND pharmacy_id = '${context.pharmacyId}'`;
  }

  throw new Error('Invalid pharmacy access configuration');
}

export function logSecurityEvent(
  event: string,
  context: SecurityContext,
  details?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId: context.userId,
    userRole: context.userRole,
    pharmacyId: context.pharmacyId,
    ...details,
  };

  // En production: envoyer vers service de monitoring
  console.log('🔐 Security Event:', logEntry);
}