import { type Request, type Response } from 'express';
import { auditSolaireSimulationService } from './audit-solaire.service';
import { HttpStatusCode, type PaginatedResult } from '@shared';
import { type IAuditSolaireSimulation } from '@shared/interfaces';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { optionalNumber, requireNumber, requireString } from '../common/validation.utils';

type AuditSolairePayload = {
  address: string;
  surfaceArea: number;
  annualConsumption: number;
  energyCostPerKwh?: number;
  latitude?: number;
  longitude?: number;
};

export class AuditSolaireSimulationController {
  public createSimulation = async (req: Request, res: Response<IAuditSolaireSimulation & { address: string }>): Promise<void> => {
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
      const { page, limit } = req.query as unknown as { page: number; limit: number };
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

  private static sanitizePayload(body: Record<string, unknown>): AuditSolairePayload {
    return {
      address: requireString(body.address, 'address'),
      surfaceArea: requireNumber(body.surfaceArea, 'surfaceArea', { min: 0 }),
      annualConsumption: requireNumber(body.annualConsumption, 'annualConsumption', { min: 0 }),
      energyCostPerKwh: optionalNumber(body.energyCostPerKwh, 'energyCostPerKwh', { min: 0 }),
      latitude: optionalNumber(body.latitude, 'latitude', { min: -90, max: 90 }),
      longitude: optionalNumber(body.longitude, 'longitude', { min: -180, max: 180 })
    };
  }
}

export const auditSolaireSimulationController = new AuditSolaireSimulationController();
