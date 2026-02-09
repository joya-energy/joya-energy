import { HTTP409Error, HTTPClientError } from '@backend/errors/http.error';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';

import { ApiValidationError } from '@backend/errors/validation.error';
import { RepositoryError } from '@backend/errors/server.error';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { Lead, type LeadDocument } from '@backend/models/lead';
import CommonRepository from '@backend/modules/common/common.repository';
import {
  type ILead,
  type ICreateLead,
  type IUpdateLead,
} from '@shared/interfaces/lead.interface';

export class LeadRepository extends CommonRepository<
  ILead,
  LeadDocument,
  ICreateLead,
  IUpdateLead
> {
  constructor() {
    super(Lead);
  }

  public async findByEmail(email: string): Promise<ILead | null> {
    const document = await this.model.findOne({ email: email.toLowerCase().trim() }).exec();
    return document ? this.dataAdapter.fromDBtoBO(document) : null;
  }

  public async createOne(lead: ICreateLead): Promise<ILead> {
    try {
      const createdLead = await super.createOne(lead);
      return createdLead;
    } catch (error) {
      Logger.error(error);
      if (
        error instanceof HTTPClientError ||
        error instanceof ApiValidationError
      ) {
        throw error;
      }
      if (
        error instanceof MongoError &&
        (error.code === 11000 || error.code === 11001)
      ) {
        throw new HTTP409Error(error.errmsg);
      }
      // Mongoose ValidationError (required field missing, wrong type, etc.) → 400 with field details
      if (error instanceof mongoose.Error.ValidationError) {
        const data: Record<string, unknown> = {};
        for (const [path, err] of Object.entries(error.errors)) {
          data[path] = (err as { message?: string }).message ?? 'Invalid';
        }
        throw new ApiValidationError('Validation failed', data);
      }
      throw new RepositoryError(`Could not create lead: ${String(error)}`);
    }
  }
}

export const leadRepository = new LeadRepository();
