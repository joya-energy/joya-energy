import CommonService from '@backend/modules/common/common.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { leadRepository } from './lead.repository';
import {
  type ILead,
  type ICreateLead,
} from '@shared/interfaces/lead.interface';

export class LeadService extends CommonService<ILead> {
  constructor() {
    super(leadRepository);
  }

  public async createLead(payload: ICreateLead): Promise<ILead | { message: string }> {
    // Check if email already exists
    const existingLead = await leadRepository.findByEmail(payload.email);
    
    if (existingLead) {
      Logger.info(`Lead with email ${payload.email} already exists`);
      return { message: 'already exist' };
    }

    // Create new lead
    const lead = await this.create(payload);
    Logger.info(`New lead created with email: ${lead.email}`);
    return lead;
  }
}

export const leadService = new LeadService();
