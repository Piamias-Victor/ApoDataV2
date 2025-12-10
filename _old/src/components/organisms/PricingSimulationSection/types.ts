// src/components/organisms/PricingSimulationSection/types.ts
export interface PricingSimulationSectionProps {
  readonly productCodes: string[];
  readonly onRefresh?: () => void;
  readonly className?: string;
}