import {
  type BusinessObject,
  type CreateBusinessObject,
  type UpdateBusinessObject
} from '@shared/interfaces/buisness.interface';
import { type RequestFilters } from '@backend/interfaces/request-filters.interface';
import type { ICommonRepository } from '@backend/modules/common/common.repository';

export class CommonService<
  T extends BusinessObject,
  C = CreateBusinessObject<T>,
  U = UpdateBusinessObject<T>,
  R extends ICommonRepository<T, C, U> = ICommonRepository<T, C, U>
> {
  protected readonly repository: R;

  constructor(repository: R) {
    this.repository = repository;
  }

  public async findAll(filters: RequestFilters = {}): Promise<T[]> {
    return this.repository.getAll(filters);
  }

  public async findById(id: string, filters: RequestFilters = {}): Promise<T | null> {
    return this.repository.getById(id, filters);
  }

  public async create(payload: Partial<C>): Promise<T> {
    return this.repository.createOne(payload);
  }

  public async update(id: string, payload: Partial<U>): Promise<T | null> {
    return this.repository.updateOne(id, payload);
  }

  public async updateMany(filter: Partial<T>, payload: Partial<U>): Promise<number> {
    return this.repository.updateMany(filter, payload);
  }

  public async delete(id: string): Promise<boolean> {
    return this.repository.deleteOne(id);
  }
}

export default CommonService;
