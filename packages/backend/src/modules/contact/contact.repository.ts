import { HTTP409Error, HTTPClientError } from '@backend/errors/http.error';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';

import { ApiValidationError } from '@backend/errors/validation.error';
import { RepositoryError } from '@backend/errors/server.error';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { Contact, type ContactDocument } from '@backend/models/contact';
import CommonRepository from '@backend/modules/common/common.repository';
import {
  type IContact,
  type ICreateContact,
  type IUpdateContact,
} from '@shared/interfaces/contact.interface';
import {
  PaginationOptions,
  PaginatedResult,
} from '@shared/interfaces/pagination.interface';

const DEFAULT_SORT = { createdAt: -1 } as const;

export class ContactRepository extends CommonRepository<
  IContact,
  ContactDocument,
  ICreateContact,
  IUpdateContact
> {
  constructor() {
    super(Contact);
  }

  public async paginate(
    options: PaginationOptions
  ): Promise<PaginatedResult<IContact>> {
    const page =
      Number.isFinite(options.page) && options.page > 0 ? options.page : 1;
    const limit =
      Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 10;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.model.find().sort(DEFAULT_SORT).skip(skip).limit(limit).exec(),
      this.model.countDocuments().exec(),
    ]);

    return {
      data: documents.map((doc) => this.dataAdapter.fromDBtoBO(doc)),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }
  public async createOne(contact: ICreateContact): Promise<IContact> {
    try {
      const createdContact = await super.createOne(contact);
      return createdContact;
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
      throw new RepositoryError(`Could not create contact: ${String(error)}`);
    }
  }
}
export const contactRepository = new ContactRepository();
