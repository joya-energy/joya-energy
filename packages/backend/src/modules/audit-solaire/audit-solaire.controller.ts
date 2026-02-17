import { type Request, type Response } from 'express';
import {
  auditSolaireSimulationService,
  type CreateSimulationInput,
} from './audit-solaire.service';
import { HttpStatusCode, type PaginatedResult } from '@shared';
import { type IAuditSolaireSimulation } from '@shared/interfaces';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { requireNumber, requireString } from '../common/validation.utils';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';
import { type OperatingHoursCase } from './config';
import { LeadCollectorService } from '../lead/lead-collector.service';

export class AuditSolaireSimulationController {
  public createSimulation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const input = AuditSolaireSimulationController.sanitizePayload(
        req.body as Record<string, string | number | boolean>
      );
      const simulation =
        await auditSolaireSimulationService.createSimulation(input);

      // Collect lead asynchronously (non-blocking)
      if (
        input.email !== null &&
        input.email !== undefined &&
        input.email !== ''
      ) {
        LeadCollectorService.collectLead({
          email: input.email,
          phoneNumber: input.phoneNumber,
          name: input.fullName,
          address: input.address,
          companyName: input.companyName,
          source: 'audit-solaire',
        }).catch(() => {
          // Silently ignored - lead collection never fails the main operation
        });
      }

      res.status(HttpStatusCode.CREATED).json(simulation);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }

      Logger.error(
        `Error: Audit solaire simulation not created: ${String(error)}`
      );
      throw new HTTP400Error(
        'Error: Audit solaire simulation not created',
        error
      );
    }
  };

  public getSimulations = async (
    req: Request,
    res: Response<PaginatedResult<IAuditSolaireSimulation>>
  ): Promise<void> => {
    try {
      const page =
        req.query.page !== undefined && req.query.page !== null
          ? Number(req.query.page)
          : 1;
      const limit =
        req.query.limit !== undefined && req.query.limit !== null
          ? Number(req.query.limit)
          : 10;
      const simulations = await auditSolaireSimulationService.getSimulations({
        page,
        limit,
      });
      res.status(HttpStatusCode.OK).json(simulations);
    } catch (error) {
      Logger.error(
        `Error: Audit solaire simulations not found: ${String(error)}`
      );
      throw new HTTP404Error(
        'Error: Audit solaire simulations not found',
        error
      );
    }
  };

  public getSimulationById = async (
    req: Request,
    res: Response<IAuditSolaireSimulation>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const simulation =
        await auditSolaireSimulationService.getSimulationById(id);
      res.status(HttpStatusCode.OK).json(simulation);
    } catch (error) {
      Logger.error(
        `Error: Audit solaire simulation not found: ${String(error)}`
      );
      throw new HTTP404Error(
        'Error: Audit solaire simulation not found',
        error
      );
    }
  };

  public deleteSimulation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await auditSolaireSimulationService.deleteSimulation(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(
        `Error: Audit solaire simulation not deleted: ${String(error)}`
      );
      throw new HTTP400Error(
        'Error: Audit solaire simulation not deleted',
        error
      );
    }
  };

  private static sanitizePayload(
    body: Record<string, string | number | boolean>
  ): CreateSimulationInput {
    // Handle case where buildingType might be an object instead of a string
    const buildingTypeRaw = body.buildingType;
    const buildingType =
      typeof buildingTypeRaw === 'string'
        ? buildingTypeRaw
        : typeof buildingTypeRaw === 'object' &&
            buildingTypeRaw !== null &&
            'id' in buildingTypeRaw
          ? (buildingTypeRaw as { id: string }).id
          : String(buildingTypeRaw);

    if (!Object.values(BuildingTypes).includes(buildingType as BuildingTypes)) {
      throw new HTTP400Error(`Invalid building type: ${buildingType}`);
    }

    // Handle case where climateZone might be an object instead of a string
    const climateZoneRaw = body.climateZone;
    const climateZone =
      typeof climateZoneRaw === 'string'
        ? climateZoneRaw
        : typeof climateZoneRaw === 'object' &&
            climateZoneRaw !== null &&
            'id' in climateZoneRaw
          ? (climateZoneRaw as { id: string }).id
          : String(climateZoneRaw);

    if (!Object.values(ClimateZones).includes(climateZone as ClimateZones)) {
      throw new HTTP400Error(`Invalid climate zone: ${climateZone}`);
    }

    const referenceMonth = requireNumber(
      body.referenceMonth,
      'referenceMonth',
      {
        min: 1,
        max: 12,
      }
    );
    const email = requireString(body.email, 'email');
    // Basic email validation (kept simple and explicit)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HTTP400Error('Invalid email format');
    }

    return {
      address: requireString(body.address, 'address'),
      fullName: requireString(body.fullName, 'fullName'),
      companyName: requireString(body.companyName, 'companyName'),
      email,
      phoneNumber: requireString(body.phoneNumber, 'phoneNumber'),
      buildingType: buildingType as BuildingTypes,
      climateZone: climateZone as ClimateZones,
      measuredAmountTnd: requireNumber(
        body.measuredAmountTnd,
        'measuredAmountTnd',
        {
          min: 0,
        }
      ),
      referenceMonth,
      // Optional MT fields - tolerate absence for BT flows
      tariffTension: (body.tariffTension === 'MT' ? 'MT' : 'BT') as 'BT' | 'MT',
      operatingHoursCase:
        (body.operatingHoursCase as any as OperatingHoursCase | null) ?? null,
      tariffRegime:
        (body.tariffRegime as any as 'uniforme' | 'horaire' | null) ?? null,
    };
  }
}

export const auditSolaireSimulationController =
  new AuditSolaireSimulationController();
