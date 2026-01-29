import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { Logger } from '@backend/middlewares';

import {
  HeatingSystemTypes,
  DomesticHotWaterTypes,
} from '@shared/enums/audit-batiment.enum';

/**
 * Validate and normalize a number value
 * Returns null if value is missing or invalid (instead of defaulting to 0)
 * Used for non-critical values that should not have artificial defaults
 */
const validateNumber = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return value;
};

/**
 * AuditReportBuilder
 *
 * Builds a compact, template-ready view model from
 * AuditEnergetiqueResponseDto.
 *
 * ⚠️ This builder MUST NOT perform energy calculations.
 * It only extracts and formats data from the DTO.
 */
export class AuditReportBuilder {
  static build(dto: AuditEnergetiqueResponseDto) {
    const data = dto.data;

    if (!data) {
      throw new Error('Cannot build audit report: DTO data is missing');
    }

    if (!data.results) {
      throw new Error('Cannot build audit report: DTO results are missing');
    }

    /* ------------------------------------------------------------------
     * TOTALS
     * ------------------------------------------------------------------ */

    const annualConsumption = validateNumber(
      data.results.energyConsumption?.annual?.value
    );

    const totalAnnualCost = validateNumber(
      data.results.energyCost?.annual?.value
    );

    const annualCo2Kg = validateNumber(
      data.results.co2Emissions?.annual?.kilograms
    );

    /* ------------------------------------------------------------------
     * INTENSITIES
     * ------------------------------------------------------------------ */

    // Extract intensities from DTO (already calculated)
    // Do NOT calculate here - builder must not perform calculations
    const energyIntensity = validateNumber(
      data.results.energyConsumption?.perSquareMeter?.value
    );

    const carbonIntensity = validateNumber(
      data.results.co2Emissions?.perSquareMeter?.value
    );

    /* ------------------------------------------------------------------
     * CLASSIFICATIONS
     * ------------------------------------------------------------------ */

    const energyClassification = data.results.energyClassification;
    const energyClass = energyClassification?.class ?? 'N/A';
    const energyIsApplicable = !!energyClassification?.isApplicable;
    
    // Extract becth from classification (do not calculate/fallback)
    const becth = validateNumber(energyClassification?.becth);

    const carbonClassification = data.results.carbonClassification;
    const carbonClass = carbonClassification?.class ?? 'N/A';
    const carbonIsApplicable = !!carbonClassification?.isApplicable;

    /* ------------------------------------------------------------------
     * SYSTEMS (ENUM → LABEL)
     * ------------------------------------------------------------------ */

    const heatingSystemRaw = data.systems?.heating ?? '';
    const heatingSystem = heatingSystemRaw in HeatingSystemTypes
      ? (HeatingSystemTypes as Record<string, string>)[heatingSystemRaw]
      : heatingSystemRaw;

    const domesticHotWaterTypeRaw = data.systems?.domesticHotWater ?? '';
    const domesticHotWaterType = domesticHotWaterTypeRaw in DomesticHotWaterTypes
      ? (DomesticHotWaterTypes as Record<string, string>)[domesticHotWaterTypeRaw]
      : domesticHotWaterTypeRaw;

    /* ------------------------------------------------------------------
     * END-USE ENERGY BREAKDOWN (PDF READY)
     * ------------------------------------------------------------------ */

    const breakdown = data.results.energyEndUseBreakdown;
    
    if (!breakdown) {
      Logger.warn('Energy end-use breakdown is missing from audit data - endUses will be null (shown as N/A in PDF)');
    }

    const totalCost = validateNumber(breakdown?.totalCostTunisianDinar);

    const percent = (cost: number | null, total: number | null): number => {
      if (cost === null || total === null || total <= 0) {
        return 0;
      }
      return Math.round((cost / total) * 100);
    };

    const endUses = breakdown
      ? {
          cooling: {
            consumptionKwh: validateNumber(breakdown.breakdown?.cooling?.consumptionKwh),
            costTunisianDinar: validateNumber(breakdown.breakdown?.cooling?.costTunisianDinar),
            sharePercent: percent(
              validateNumber(breakdown.breakdown?.cooling?.costTunisianDinar),
              totalCost
            ),
          },
          heating: {
            consumptionKwh: validateNumber(breakdown.breakdown?.heating?.consumptionKwh),
            costTunisianDinar: validateNumber(breakdown.breakdown?.heating?.costTunisianDinar),
            sharePercent: percent(
              validateNumber(breakdown.breakdown?.heating?.costTunisianDinar),
              totalCost
            ),
          },
          lighting: {
            consumptionKwh: validateNumber(breakdown.breakdown?.lighting?.consumptionKwh),
            costTunisianDinar: validateNumber(breakdown.breakdown?.lighting?.costTunisianDinar),
            sharePercent: percent(
              validateNumber(breakdown.breakdown?.lighting?.costTunisianDinar),
              totalCost
            ),
          },
          equipment: {
            consumptionKwh: validateNumber(breakdown.breakdown?.equipment?.consumptionKwh),
            costTunisianDinar: validateNumber(breakdown.breakdown?.equipment?.costTunisianDinar),
            sharePercent: percent(
              validateNumber(breakdown.breakdown?.equipment?.costTunisianDinar),
              totalCost
            ),
          },
          domesticHotWater: {
            consumptionKwh: validateNumber(breakdown.breakdown?.domesticHotWater?.consumptionKwh),
            costTunisianDinar: validateNumber(breakdown.breakdown?.domesticHotWater?.costTunisianDinar),
            sharePercent: percent(
              validateNumber(breakdown.breakdown?.domesticHotWater?.costTunisianDinar),
              totalCost
            ),
          },
          total: {
            consumptionKwh: validateNumber(breakdown.totalConsumptionKwh),
            costTunisianDinar: totalCost,
          },
        }
      : null;

    /* ------------------------------------------------------------------
     * LOG
     * ------------------------------------------------------------------ */

    Logger.info('AuditReportBuilder.build: audit report view model ready');

    /* ------------------------------------------------------------------
     * FINAL VIEW MODEL
     * Return null values as-is - missing data should remain null
     * ------------------------------------------------------------------ */

    return {
      // Totals
      annualConsumption,
      totalAnnualCost,
      annualCo2Kg,

      // Energy performance
      energyIntensity,
      energyClass,
      energyIsApplicable,
      becth,

      // Carbon performance
      carbonIntensity,
      carbonClass,
      carbonIsApplicable,

      // Systems
      heatingSystem,
      domesticHotWaterType,

      // End-use breakdown (PDF table + bars)
      endUses,
    };
  }
}
