import { type Request, type Response } from 'express';
import { auditSolaireSimulationService, type CreateSimulationInput } from './audit-solaire.service';
import { HttpStatusCode, type PaginatedResult } from '@shared';
import { type IAuditSolaireSimulation } from '@shared/interfaces';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { requireNumber, requireString } from '../common/validation.utils';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';

export class AuditSolaireSimulationController {
  public createSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = AuditSolaireSimulationController.sanitizePayload(req.body);
      const simulation = await auditSolaireSimulationService.createSimulation(input);
      res.status(HttpStatusCode.CREATED).json(simulation);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }

      Logger.error(`Error: Audit solaire simulation not created: ${String(error)}`);
      throw new HTTP400Error('Error: Audit solaire simulation not created', error);
    }
  };

  public getSimulations = async (req: Request, res: Response<PaginatedResult<IAuditSolaireSimulation>>): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const simulations = await auditSolaireSimulationService.getSimulations({ page, limit });
      res.status(HttpStatusCode.OK).json(simulations);
    } catch (error) {
      Logger.error(`Error: Audit solaire simulations not found: ${String(error)}`);
      throw new HTTP404Error('Error: Audit solaire simulations not found', error);
    }
  };

  public getSimulationById = async (req: Request, res: Response<IAuditSolaireSimulation>): Promise<void> => {
    try {
      const { id } = req.params;
      const simulation = await auditSolaireSimulationService.getSimulationById(id);
      res.status(HttpStatusCode.OK).json(simulation);
    } catch (error) {
      Logger.error(`Error: Audit solaire simulation not found: ${String(error)}`);
      throw new HTTP404Error('Error: Audit solaire simulation not found', error);
    }
  };

  public deleteSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await auditSolaireSimulationService.deleteSimulation(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(`Error: Audit solaire simulation not deleted: ${String(error)}`);
      throw new HTTP400Error('Error: Audit solaire simulation not deleted', error);
    }
  };

  private static sanitizePayload(body: Record<string, string | number | boolean>): CreateSimulationInput {
    const buildingType = body.buildingType as BuildingTypes;
    if (!Object.values(BuildingTypes).includes(buildingType)) {
      throw new HTTP400Error(`Invalid building type: ${buildingType}`);
    }

    const climateZone = body.climateZone as ClimateZones;
    if (!Object.values(ClimateZones).includes(climateZone)) {
      throw new HTTP400Error(`Invalid climate zone: ${climateZone}`);
    }

    const referenceMonth = requireNumber(body.referenceMonth, 'referenceMonth', { min: 1, max: 12 });

    return {
      address: requireString(body.address, 'address'),
      buildingType,
      climateZone,
      measuredConsumptionKwh: requireNumber(body.measuredConsumption, 'measuredConsumption', { min: 0 }),
      referenceMonth,
    };
  }
}

export const auditSolaireSimulationController = new AuditSolaireSimulationController();
