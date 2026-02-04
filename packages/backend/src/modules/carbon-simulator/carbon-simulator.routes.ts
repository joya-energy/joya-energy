import asyncRouter from 'express-promise-router';
import { Request, Response, NextFunction } from 'express';
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { calculateCarbonFootprintSummary } from './helpers/carbon-footprint-summary.calculator';
import type { CarbonFootprintSummaryInput } from './helpers/carbon-footprint-summary.calculator';

export const carbonSimulatorRoutes = asyncRouter();

/** Map sector key (e.g. OFFICE_ADMIN_BANK) to BuildingTypes value (label) for electricity extrapolation. Throws if unknown. */
function sectorKeyToBuildingTypeLabel(key: string): string {
  const label = (BuildingTypes as Record<string, string>)[key];
  if (label !== undefined) return label;
  // Already a label (enum value)?
  if (Object.values(BuildingTypes).includes(key as BuildingTypes)) return key;
  throw new Error(`Unknown building type or sector key: ${key}`);
}

/**
 * POST /api/carbon-simulator/summary
 * Body: CarbonFootprintSummaryInput (electricity.buildingType can be sector key or label)
 * Returns: CarbonFootprintSummaryResult
 */
carbonSimulatorRoutes.post(
  '/summary',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CarbonFootprintSummaryInput;
      const electricity = {
        ...body.electricity,
        buildingType: sectorKeyToBuildingTypeLabel(
          body.electricity.buildingType
        ) as CarbonFootprintSummaryInput['electricity']['buildingType'],
      };
      const input: CarbonFootprintSummaryInput = { ...body, electricity };
      const result = calculateCarbonFootprintSummary(input);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
