import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { Logger } from '@backend/middlewares';

import {
  HeatingSystemTypes,
  DomesticHotWaterTypes,
} from '@shared/enums/audit-batiment.enum';

/**
 * AuditReportBuilder
 *
 * Builds a compact, template-ready view model from
 * AuditEnergetiqueResponseDto.
 *
 * ⚠️ This builder MUST NOT perform energy calculations.
 */
export class AuditReportBuilder {
  static build(dto: AuditEnergetiqueResponseDto) {
    const data = dto.data;

    /* ------------------------------------------------------------------
     * HELPERS
     * ------------------------------------------------------------------ */

    const safe = (v?: number) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    /* ------------------------------------------------------------------
     * TOTALS
     * ------------------------------------------------------------------ */

    const annualConsumption =
      safe(data.results?.energyConsumption?.annual?.value);

    const totalAnnualCost =
      safe(data.results?.energyCost?.annual?.value);

    const annualCo2Kg =
      safe(data.results?.co2Emissions?.annual?.kilograms);

    const surfaceArea = safe(data.building?.surfaceArea) || 1;

    /* ------------------------------------------------------------------
     * INTENSITIES
     * ------------------------------------------------------------------ */

    const energyIntensity =
      safe(data.results?.energyConsumption?.perSquareMeter?.value) ||
      annualConsumption / surfaceArea;

    const carbonIntensity =
      safe(data.results?.co2Emissions?.perSquareMeter?.value) ||
      annualCo2Kg / surfaceArea;

    /* ------------------------------------------------------------------
     * CLASSIFICATIONS
     * ------------------------------------------------------------------ */

    const energyClassification = data.results?.energyClassification;
    const energyClass = energyClassification?.class ?? 'N/A';
    const energyIsApplicable = !!energyClassification?.isApplicable;
    const becth = safe(energyClassification?.becth) || energyIntensity;

    const carbonClassification = data.results?.carbonClassification;
    const carbonClass = carbonClassification?.class ?? 'N/A';
    const carbonIsApplicable = !!carbonClassification?.isApplicable;

    /* ------------------------------------------------------------------
     * SYSTEMS (ENUM → LABEL)
     * ------------------------------------------------------------------ */

    const heatingSystemRaw = data.systems?.heating ?? '';
    const heatingSystem =
      (HeatingSystemTypes as any)[heatingSystemRaw] ?? heatingSystemRaw;

    const ecsTypeRaw = data.systems?.domesticHotWater ?? '';
    const ecsType =
      (DomesticHotWaterTypes as any)[ecsTypeRaw] ?? ecsTypeRaw;

    /* ------------------------------------------------------------------
     * END-USE ENERGY BREAKDOWN (PDF READY)
     * ------------------------------------------------------------------ */

    const breakdown = data.results?.energyEndUseBreakdown;
    const totalCost = safe(breakdown?.totalCostTnd);

    const percent = (cost: number) =>
      totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;

    const endUses = breakdown
      ? {
          cooling: {
            consumptionKwh: safe(breakdown.breakdown?.cooling?.consumptionKwh),
            costTnd: safe(breakdown.breakdown?.cooling?.costTnd),
            sharePercent: percent(
              safe(breakdown.breakdown?.cooling?.costTnd)
            ),
          },
          heating: {
            consumptionKwh: safe(breakdown.breakdown?.heating?.consumptionKwh),
            costTnd: safe(breakdown.breakdown?.heating?.costTnd),
            sharePercent: percent(
              safe(breakdown.breakdown?.heating?.costTnd)
            ),
          },
          lighting: {
            consumptionKwh: safe(breakdown.breakdown?.lighting?.consumptionKwh),
            costTnd: safe(breakdown.breakdown?.lighting?.costTnd),
            sharePercent: percent(
              safe(breakdown.breakdown?.lighting?.costTnd)
            ),
          },
          equipment: {
            consumptionKwh: safe(breakdown.breakdown?.equipment?.consumptionKwh),
            costTnd: safe(breakdown.breakdown?.equipment?.costTnd),
            sharePercent: percent(
              safe(breakdown.breakdown?.equipment?.costTnd)
            ),
          },
          ecs: {
            consumptionKwh: safe(breakdown.breakdown?.dhw?.consumptionKwh),
            costTnd: safe(breakdown.breakdown?.dhw?.costTnd),
            sharePercent: percent(
              safe(breakdown.breakdown?.dhw?.costTnd)
            ),
          },
          total: {
            consumptionKwh: safe(breakdown.totalConsumptionKwh),
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
