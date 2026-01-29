import { type Request, type Response } from 'express';
import { auditSolaireSimulationService } from './audit-solaire.service';
import { HttpStatusCode, type PaginatedResult } from '@shared';
import { type IAuditSolaireSimulation } from '@shared/interfaces';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { z } from 'zod';

const createAuditSolaireSchema = z.object({
  address: z.string().trim().min(3, 'L\'adresse doit contenir au moins 3 caractères'),
  surfaceArea: z.coerce.number().positive('La surface doit être supérieure à 0'),
  annualConsumption: z.coerce.number().positive('La consommation annuelle doit être supérieure à 0'),
  energyCostPerKwh: z.coerce.number().positive().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

export class AuditSolaireSimulationController {
  public createSimulation = async (req: Request, res: Response<IAuditSolaireSimulation & { address: string }>): Promise<void> => {
    try {
      const parsedInput = createAuditSolaireSchema.parse(req.body);
      const simulation = await auditSolaireSimulationService.createSimulation(parsedInput);
      res.status(HttpStatusCode.CREATED).json(simulation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTP400Error('Invalid audit solaire request payload', error);
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
}

export const auditSolaireSimulationController = new AuditSolaireSimulationController();
