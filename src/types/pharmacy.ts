// src/types/pharmacy.ts

export interface Pharmacy {
  readonly id: string;
  readonly id_nat: string | null;
  readonly name: string;
  readonly address: string | null;
  readonly area: string | null;
  readonly ca: number | null;
  readonly employees_count: number | null;
  readonly surface?: number | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PharmacyUpdateData {
  readonly name?: string;
  readonly id_nat?: string | null;
  readonly address?: string | null;
  readonly area?: string | null;
  readonly ca?: number | null;
  readonly employees_count?: number | null;
  readonly surface?: number | null;
}

export interface PharmaciesResponse {
  readonly pharmacies: Pharmacy[];
  readonly pagination: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalItems: number;
    readonly itemsPerPage: number;
  };
}

export interface PharmacyFilters {
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}