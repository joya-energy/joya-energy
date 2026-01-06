import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { Logger } from '@backend/middlewares';

import {
  HeatingSystemTypes,
  DomesticHotWaterTypes,
} from '@shared/enums/audit-batiment.enum';

/**
 * Helper function to safely extract numbers from DTO
 * Returns defaultValue if value is null, undefined, or not a finite number
 */
const ensureNumber = (value: number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return defaultValue;
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

    const annualConsumption = ensureNumber(
      data.results.energyConsumption?.annual?.value,
      0
    );

    const totalAnnualCost = ensureNumber(
      data.results.energyCost?.annual?.value,
      0
    );

    const annualCo2Kg = ensureNumber(
      data.results.co2Emissions?.annual?.kilograms,
      0
    );

    /* ------------------------------------------------------------------
     * INTENSITIES
     * ------------------------------------------------------------------ */

    // Extract intensities from DTO (already calculated)
    // Do NOT calculate here - builder must not perform calculations
    const energyIntensity = ensureNumber(
      data.results.energyConsumption?.perSquareMeter?.value,
      0
    );

    const carbonIntensity = ensureNumber(
      data.results.co2Emissions?.perSquareMeter?.value,
      0
    );

    /* ------------------------------------------------------------------
     * CLASSIFICATIONS
     * ------------------------------------------------------------------ */

    const energyClassification = data.results.energyClassification;
    const energyClass = energyClassification?.class ?? 'N/A';
    const energyIsApplicable = !!energyClassification?.isApplicable;
    
    // Extract becth from classification (do not calculate/fallback)
    const becth = ensureNumber(energyClassification?.becth, 0);

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

    const ecsTypeRaw = data.systems?.domesticHotWater ?? '';
    const ecsType = ecsTypeRaw in DomesticHotWaterTypes
      ? (DomesticHotWaterTypes as Record<string, string>)[ecsTypeRaw]
      : ecsTypeRaw;

    /* ------------------------------------------------------------------
     * END-USE ENERGY BREAKDOWN (PDF READY)
     * ------------------------------------------------------------------ */

    const breakdown = data.results.energyEndUseBreakdown;
    
    if (!breakdown) {
      Logger.warn('Energy end-use breakdown is missing from audit data');
    }

    const totalCost = ensureNumber(breakdown?.totalCostTnd, 0);

    const percent = (cost: number): number => {
      if (totalCost <= 0) {
        return 0;
      }
      return Math.round((cost / totalCost) * 100);
    };

    const endUses = breakdown
      ? {
          cooling: {
            consumptionKwh: ensureNumber(breakdown.breakdown?.cooling?.consumptionKwh, 0),
            costTnd: ensureNumber(breakdown.breakdown?.cooling?.costTnd, 0),
            sharePercent: percent(
              ensureNumber(breakdown.breakdown?.cooling?.costTnd, 0)
            ),
          },
          heating: {
            consumptionKwh: ensureNumber(breakdown.breakdown?.heating?.consumptionKwh, 0),
            costTnd: ensureNumber(breakdown.breakdown?.heating?.costTnd, 0),
            sharePercent: percent(
              ensureNumber(breakdown.breakdown?.heating?.costTnd, 0)
            ),
          },
          lighting: {
            consumptionKwh: ensureNumber(breakdown.breakdown?.lighting?.consumptionKwh, 0),
            costTnd: ensureNumber(breakdown.breakdown?.lighting?.costTnd, 0),
            sharePercent: percent(
              ensureNumber(breakdown.breakdown?.lighting?.costTnd, 0)
            ),
          },
          equipment: {
            consumptionKwh: ensureNumber(breakdown.breakdown?.equipment?.consumptionKwh, 0),
            costTnd: ensureNumber(breakdown.breakdown?.equipment?.costTnd, 0),
            sharePercent: percent(
              ensureNumber(breakdown.breakdown?.equipment?.costTnd, 0)
            ),
          },
          ecs: {
            consumptionKwh: ensureNumber(breakdown.breakdown?.dhw?.consumptionKwh, 0),
            costTnd: ensureNumber(breakdown.breakdown?.dhw?.costTnd, 0),
            sharePercent: percent(
              ensureNumber(breakdown.breakdown?.dhw?.costTnd, 0)
            ),
          },
          total: {
            consumptionKwh: ensureNumber(breakdown.totalConsumptionKwh, 0),
            costTnd: totalCost,
          },
        }
      : null;

    /* ------------------------------------------------------------------
     * LOG
     * ------------------------------------------------------------------ */

    Logger.info('AuditReportBuilder.build: audit report view model ready');

    /* ------------------------------------------------------------------
     * FINAL VIEW MODEL
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
      ecsType,

      // End-use breakdown (PDF table + bars)
      endUses,
    };
  }
}
