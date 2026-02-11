import { type Request, type Response } from 'express';
import { leadService } from './lead.service';
import { type ILead } from '@shared/interfaces/lead.interface';
import { HttpStatusCode } from '@shared';
import { HTTP400Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';

export class LeadController {
  public createLead = async (
    req: Request,
    res: Response<ILead | { message: string }>
  ): Promise<void> => {
    try {
      // Validate that email is provided
      if (!req.body.email || typeof req.body.email !== 'string' || !req.body.email.trim()) {
        throw new HTTP400Error('Email is required');
      }

      const result = await leadService.createLead(req.body);

      // If email already exists, return 200 with message
      if ('message' in result && result.message === 'already exist') {
        res.status(HttpStatusCode.OK).json({ message: 'already exist' });
        return;
      }

      // Otherwise, return created lead with 201
      res.status(HttpStatusCode.CREATED).json(result as ILead);
    } catch (error) {
      Logger.error(`Error: Lead not created: ${String(error)}`);
      throw new HTTP400Error('Error: Lead not created', error);
    }
  };

  public getLeads = async (_req: Request, res: Response<ILead[]>): Promise<void> => {
    try {
      const leads = await leadService.findAll();
      res.status(HttpStatusCode.OK).json(leads);
    } catch (error) {
      Logger.error(`Error: Leads not found: ${String(error)}`);
      throw new HTTP400Error('Error: Leads not found', error);
    }
  };

  public updateLeadStatus = async (req: Request, res: Response<ILead>): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || typeof status !== 'string') {
        throw new HTTP400Error('Status is required');
      }

      const validStatuses = ['nouveau', 'contacté', 'qualifié', 'converti', 'perdu'];
      if (!validStatuses.includes(status)) {
        throw new HTTP400Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updatedLead = await leadService.updateLeadStatus(id, status);
      
      if (!updatedLead) {
        throw new HTTP400Error('Lead not found');
      }

      res.status(HttpStatusCode.OK).json(updatedLead);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }
      Logger.error(`Error: Lead status not updated: ${String(error)}`);
      throw new HTTP400Error('Error: Lead status not updated', error);
    }
  };
}

export const leadController = new LeadController();
