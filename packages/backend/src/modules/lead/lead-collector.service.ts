/**
 * Lead Collector Service
 * Non-blocking service to collect leads from various sources
 * This service silently collects leads without affecting the main API flow
 */

import { leadService } from './lead.service';
import { Logger } from '@backend/middlewares';
import { type ICreateLead } from '@shared/interfaces/lead.interface';

export type LeadSource = 'simulator' | 'contact-form' | 'newsletter' | 'audit-solaire' | 'audit-energetique' | 'carbon-simulator' | 'financing-comparison';

export interface LeadData {
  email: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  companyName?: string;
  source?: LeadSource;
}

export class LeadCollectorService {
  /**
   * Collects a lead asynchronously without blocking the main flow
   * This method never throws errors - it silently logs failures
   */
  public static async collectLead(data: LeadData): Promise<void> {
    // Validate email is present
    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
      Logger.warn('Lead collection skipped: email is required');
      return;
    }

    // Fire and forget - don't await, don't block
    setImmediate(async () => {
      try {
        const leadPayload: ICreateLead = {
          email: data.email.trim().toLowerCase(),
          phoneNumber: data.phoneNumber?.trim(),
          name: data.name?.trim(),
          address: data.address?.trim(),
          companyName: data.companyName?.trim(),
          source: data.source || 'simulator',
        };

        const result = await leadService.createLead(leadPayload);
        
        if ('message' in result && result.message === 'already exist') {
          Logger.debug(`Lead with email ${data.email} already exists`);
        } else {
          Logger.info(`✅ Lead collected: ${data.email} (source: ${leadPayload.source})`);
        }
      } catch (error) {
        // Silently log - never fail the main operation
        Logger.warn(`Failed to collect lead for ${data.email}: ${(error as Error).message}`);
      }
    });
  }
}
