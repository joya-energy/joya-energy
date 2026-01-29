/**
 * Financing Comparison Repository
 * Data access layer for financing comparisons
 */

import CommonRepository from '@backend/modules/common/common.repository';
import { FinancingComparison, type FinancingComparisonDocument } from '@backend/models/financing-comparison';
import { ComparisonResult, CalculatedComparisonResult } from '@backend/domain/financing';
import { Governorates } from '@shared/enums/audit-general.enum';

class FinancingComparisonRepository extends CommonRepository<
  ComparisonResult,
  FinancingComparisonDocument,
  CalculatedComparisonResult
> {
  constructor() {
    super(FinancingComparison);
  }

  /**
   * Find comparisons by location
   */
  public async findByLocation(location: Governorates): Promise<ComparisonResult[]> {
    return this.getAll({ 'input.location': location });
  }

  /**
   * Find recent comparisons (last N days)
   */
  public async findRecent(days: number = 30): Promise<ComparisonResult[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.getAll({
      createdAt: { $gte: dateThreshold },
    });
  }
}

export const financingComparisonRepository = new FinancingComparisonRepository();
export default FinancingComparisonRepository;

