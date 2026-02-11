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
}

export const leadController = new LeadController();
