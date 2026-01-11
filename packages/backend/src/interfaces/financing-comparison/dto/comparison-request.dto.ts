/**
 * DTOs for financing comparison requests
 */

import { ProjectInput, CreditParameters, LeasingParameters, EscoParameters } from '@backend/domain/financing';

/**
 * Request DTO for creating a financing comparison
 */
export interface ComparisonRequestDto extends ProjectInput {
  location: string;
  installationSizeKwp?: number;
  investmentAmountDt?: number;
  creditParams?: Partial<CreditParameters>;
  leasingParams?: Partial<LeasingParameters>;
  escoParams?: Partial<EscoParameters>;
}

/**
 * Response DTO for financing comparison
 * Extends ComparisonResult with metadata
 */
export interface ComparisonResponseDto {
  id: string;
  input: ProjectInput;
  projectCalculation: {
    sizeKwp: number;
    capexDt: number;
    annualProductionKwh: number;
    annualGrossSavingsDt: number;
    monthlyGrossSavingsDt: number;
    annualOpexDt: number;
    monthlyOpexDt: number;
  };
  cash: Record<string, unknown>;
  credit: Record<string, unknown>;
  leasing: Record<string, unknown>;
  esco: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

