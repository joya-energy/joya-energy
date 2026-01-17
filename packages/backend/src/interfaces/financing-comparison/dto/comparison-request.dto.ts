/**
 * DTOs for financing comparison requests
 */

import { ProjectInput, CreditParameters, LeasingParameters, EscoParameters, CreateComparisonResult } from '@backend/domain/financing';

/**
 * Request DTO for creating a financing comparison
 */
export interface ComparisonRequestDto extends Omit<ProjectInput, 'installationSizeKwp' | 'investmentAmountDt'> {
  installationSizeKwp?: number;
  investmentAmountDt?: number;
  creditParams?: Partial<CreditParameters>;
  leasingParams?: Partial<LeasingParameters>;
  escoParams?: Partial<EscoParameters>;
}

/**
 * Response DTO for financing comparison
 * Based on CreateComparisonResult (no id, not persisted)
 */
export interface ComparisonResponseDto extends CreateComparisonResult {
  // No additional fields needed for non-persisted responses
}

