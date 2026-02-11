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

    // Set default status if not provided
    const leadPayload: ICreateLead = {
      ...payload,
      status: payload.status || 'nouveau',
    };

    // Create new lead
    const lead = await this.create(leadPayload);
    Logger.info(`New lead created with email: ${lead.email}, status: ${lead.status || 'nouveau'}`);
    return lead;
  }

  public async updateLeadStatus(id: string, status: string): Promise<ILead | null> {
    const validStatuses = ['nouveau', 'contacté', 'qualifié', 'converti', 'perdu'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await this.update(id, { status: status as any });
    if (updated) {
      Logger.info(`Lead ${id} status updated to: ${status}`);
    }
    return updated;
  }
}

export const leadService = new LeadService();
