// src/types/pricingCalculator.ts

/**
 * Types pour calculateur prix/marge pharmaceutique
 * Basé sur modèle Excel avec remises RFA et RSF
 */

export interface PricingScenario {
  readonly id: string;
  readonly name: string;
  readonly inputs: PricingInputs;
  readonly results: PricingResults;
}

export interface PricingInputs {
  readonly prixTarif: number;
  readonly rsf: number; // %
  readonly rfa1: number; // %
  readonly rfa2: number; // %
  readonly tva: number; // %
  readonly quantiteCommandee: number;
  readonly ugGratuits: number;
  readonly prixPublic: number;
}

export interface PricingResults {
  readonly prixNetRemise: number;
  readonly prixNetAvecUG: number;
  readonly deductionRFA1: number;
  readonly prixNetAvecRFA1: number;
  readonly deductionRFA2: number;
  readonly prixNetAvecRFA2: number;
  readonly margeEuros: number;
  readonly coef: number;
  readonly margePourcent: number;
}

export const DEFAULT_INPUTS: PricingInputs = {
  prixTarif: 5,
  rsf: 0,
  rfa1: 0,
  rfa2: 0,
  tva: 20,
  quantiteCommandee: 0,
  ugGratuits: 0,
  prixPublic: 10
};