// Disable cause templated
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable no-await-in-loop */

import {
    type Model,
    type Document,
    Types,
    isValidObjectId,
    type FilterQuery,
    type SaveOptions,
    type QueryOptions,
    type HydratedDocument,
    type Query,
    type ClientSession,
    type PopulateOptions,
    type InsertManyOptions
  } from 'mongoose';
  import { Logger } from '@backend/middlewares/logger.midddleware';
  import { RepositoryError } from '@backend/errors/server.error';
  import { type BusinessObject, type CreateBusinessObject, type UpdateBusinessObject, isNullish } from '@shared';
  import { performance } from 'perf_hooks';
  import { type RequestFilters } from '@backend/interfaces/request-filters.interface';
  import { type ObjectId, type DeleteOptions, type UpdateOptions } from 'mongodb';
  import { CommonFilterAdapter } from './common.filter-adapter';
  import { CommonDataAdapter, type ICommonDataAdapter } from './common.data-adapter';
  
  export interface ICommonRepository<T extends BusinessObject, C = CreateBusinessObject<T>, U = UpdateBusinessObject<T>> {
    getAll(filters?: RequestFilters): Promise<T[]>;
    getById(id: string, filters?: RequestFilters): Promise<T | null>;
    createOne(res: Partial<C>): Promise<T>;
    updateOne(id: string, res: Partial<U>): Promise<T | null>;
    updateMany(filter: Partial<T>, update: Partial<U>): Promise<number>;
    deleteOne(id: string): Promise<boolean>;
  }
  
  class CommonRepository<T extends BusinessObject, D = Document<ObjectId> & T, C = CreateBusinessObject<T>, U = UpdateBusinessObject<T>>
    implements ICommonRepository<T, C, U>
  {
    // eslint-disable-next-line no-empty-function
    constructor(public model: Model<D>, public dataAdapter: ICommonDataAdapter<T, D> = new CommonDataAdapter<T, D>()) {}
  
    /***********************
     *    Public methods   *
     ***********************/
  
    async getAll(filter: any = {}): Promise<T[]> {
      const mongooseFilters: FilterQuery<D> = CommonFilterAdapter.fromApiToMongoose<D>(filter);
      const docs = await this.modelGetAll(mongooseFilters);
      return docs.map((doc) => this.dataAdapter.fromDBtoBO(doc));
    }
  
    async getById(id: string, populate?: any): Promise<T | null> {
      const doc = await this.modelGetById(id, populate);
      return doc != null ? this.dataAdapter.fromDBtoBO(doc) : null;
    }
  
    async createOne(res: Partial<C>, session?: ClientSession): Promise<T> {
      return this.dataAdapter.fromDBtoBO(await this.modelCreateOne(res, { session }));
    }
  
    async createMany(res: C[], session?: ClientSession): Promise<T[]> {
      const docs = await this.modelBulkCreate(res, { session });
      return docs?.map((d) => this.dataAdapter.fromDBtoBO(d)) ?? [];
    }
  
    async insertMany(res: C[], options?: InsertManyOptions): Promise<T[]> {
      const docs = await this.modelInsertMany(res, options);
      return docs?.map((d) => this.dataAdapter.fromDBtoBO(d)) ?? [];
    }
  
    async insertManyBatch(res: C[], batchSize: number, options?: InsertManyOptions): Promise<boolean> {
      try {
        const timeElapsed = performance.now();
        while (res.length > 0) {
          const batch = res.splice(0, batchSize);
          await this.modelInsertMany(batch, options);
        }
        Logger.debug(`Insertion successfully done in ${parseFloat(`${(performance.now() - timeElapsed) / 1000}`).toPrecision(3)} seconds!`);
        return true;
      } catch (error) {
        Logger.error(error);
        throw new RepositoryError('An error has occured while inserting docs');
      }
    }
  
    async updateOne(id: string, res: Partial<U>): Promise<T | null> {
      const updatedDoc = await this.modelUpdateOne(id, res);
      return updatedDoc != null ? this.dataAdapter.fromDBtoBO(updatedDoc) : null;
    }
  
    async updateMany(filter: Partial<T>, update: Partial<U>): Promise<number> {
      return await this.modelUpdateMany(filter, update);
    }
  
    async deleteOne(id: string): Promise<boolean> {
      const deletedCount = await this.modelDeleteOne(id);
      return deletedCount === 1;
    }
  
    async deleteMany(filter: any = {}, session?: ClientSession): Promise<number> {
      return await this.modelDeleteMany(filter, session);
    }
  
    /**********************
     *  Protected methods *
     **********************/
    protected async modelGetAll(filter: FilterQuery<D> = {}): Promise<D[]> {
      return await this.model.find(filter);
    }
  
    protected async modelGetById(id: string, populate?: PopulateOptions | PopulateOptions[]): Promise<D | null> {
      if (!isValidObjectId(id) || isNullish(id)) {
        throw new RepositoryError(`Could not retrieve document for given ID: ${id} is not a valid ObjectId`, { wrongId: id });
      }
      const objId = new Types.ObjectId(id);
      if (populate == null) {
        return await this.model.findById(objId);
      }
      return await (this.model.findById(objId).populate(populate) as Query<
        HydratedDocument<D, unknown, unknown> | null,
        HydratedDocument<D, unknown, unknown>,
        unknown,
        D
      >);
    }
  
    protected async modelCreateOne(res: Partial<C>, options?: SaveOptions): Promise<D> {
      if (isNullish(res)) {
        throw new RepositoryError('Could not create document: received a nullish reference');
      }
  
      try {
        const createdRes = await this.model.create([res], options);
        if (createdRes?.length !== 1) {
          throw new RepositoryError('Document creation did not return exactly one element');
        } else {
          return createdRes[0];
        }
      } catch (err) {
        Logger.error(err);
        throw new RepositoryError(`Could not create doc:${String(err)}`);
      }
    }
  
    protected async modelBulkCreate(res: C[], options?: SaveOptions): Promise<D[]> {
      try {
        // cannot use insertMany as it skips validation
        return await this.model.create(res, options);
      } catch (err) {
        Logger.error(err);
        throw new RepositoryError(`Could not insert docs: ${String(err)}`);
      }
    }
  
    protected async modelInsertMany(res: C[], options?: InsertManyOptions): Promise<D[]> {
      try {
        // we use insert many
        const docs = await this.model.insertMany(res, options != null ? options : {});
        return docs.map((doc) => doc.toObject());
      } catch (err) {
        Logger.error(err);
        throw new RepositoryError(`Could not insert docs: ${String(err)}`);
      }
    }
  
    protected async modelUpdateOne(id: string, update: Partial<U>, options?: QueryOptions): Promise<D | null> {
      if (isNullish(id)) {
        throw new RepositoryError('Could not update document: no id specified');
      }
      return await this.model.findByIdAndUpdate(id, { $set: update } as any, { new: true, ...options });
    }
  
    protected async modelUpdateMany(filter: Partial<T>, update: Partial<U>, options?: UpdateOptions): Promise<number> {
      const updateRes = await this.model.updateMany(filter as FilterQuery<D>, { $set: update } as any, options);
      return updateRes.modifiedCount;
    }
  
    protected async modelDeleteOne(id: string, options?: DeleteOptions): Promise<number | undefined> {
      if (isNullish(id)) {
        throw new RepositoryError('Could not update document: no id specified');
      }
      const deleteResult = await this.model.deleteOne({ _id: id as any }, options);
      return deleteResult.deletedCount;
    }
  
    protected async modelDeleteMany(filter: any = {}, session?: ClientSession): Promise<number> {
      const deleteResult = await this.model.deleteMany(filter as FilterQuery<D>, { session });
      return deleteResult.deletedCount ?? 0;
    }
  }
  
  export default CommonRepository;
  