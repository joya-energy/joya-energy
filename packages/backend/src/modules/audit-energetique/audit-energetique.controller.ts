import { type Request, type Response } from 'express';
import { auditSimulationService } from './audit-energetique.service';
import { HttpStatusCode } from '@shared';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import {type AuditEnergetiqueResponseDto, toAuditEnergetiqueResponseDto} from './dto/audit-energetique-response.dto';
import { AuditRequestPayload, sanitizeAuditPayload} from './utils/payload-normalizer';
import { LeadCollectorService } from '../lead/lead-collector.service';

export class AuditEnergetiqueSimulationController {
  public createSimulation = async (req: Request, res: Response<AuditEnergetiqueResponseDto>): Promise<void> => {
    try {
      const input = sanitizeAuditPayload(req.body as AuditRequestPayload);
      const simulation = await auditSimulationService.createSimulation(input);
      
      // Transform to structured response
      const response = toAuditEnergetiqueResponseDto(simulation);
      
      // Collect lead asynchronously (non-blocking)
      if (input.email) {
        LeadCollectorService.collectLead({
          email: input.email,
          phoneNumber: input.phoneNumber,
          name: input.fullName,
          address: input.address,
          companyName: input.companyName,
          source: 'audit-energetique',
        }).catch(() => {
          // Silently ignored - lead collection never fails the main operation
        });
      }
      
      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }

      Logger.error(`Error: Audit energetique simulation not created: ${String(error)}`);
      throw new HTTP400Error('Error: Audit energetique simulation not created', error);
    }
  };


  public getSimulationById = async (req: Request, res: Response<AuditEnergetiqueResponseDto>): Promise<void> => {
    try {
      const { id } = req.params;
      const simulation = await auditSimulationService.getSimulationById(id);
      
      // Transform to structured response
      const response = toAuditEnergetiqueResponseDto(simulation);
      
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      Logger.error(`Error: Audit energetique simulation not found: ${String(error)}`);
      throw new HTTP404Error('Error: Audit energetique simulation not found', error);
    }
  };

  public deleteSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await auditSimulationService.deleteSimulation(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(`Error: Audit energetique simulation not deleted: ${String(error)}`);
      throw new HTTP400Error('Error: Audit energetique simulation not deleted', error);
    }
  };
}

export const auditEnergetiqueSimulationController = new AuditEnergetiqueSimulationController();
