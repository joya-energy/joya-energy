import CommonRepository from '@backend/modules/common/common.repository';
import {
  type IAuditSolaireSimulation,
  type ICreateAuditSolaireSimulation,
  type IUpdateAuditSolaireSimulation
} from '@shared/interfaces';
import {
  AuditSolaireSimulation,
  type AuditSolaireSimulationDocument
} from '@backend/models/audit-solaire';
import { PaginationOptions, PaginatedResult } from '@shared/interfaces/pagination.interface';

const DEFAULT_SORT = { createdAt: -1 } as const;

export class AuditSolaireSimulationRepository extends CommonRepository<
  IAuditSolaireSimulation,
  AuditSolaireSimulationDocument,
  ICreateAuditSolaireSimulation,
  IUpdateAuditSolaireSimulation
> {
  constructor() {
    super(AuditSolaireSimulation);
  }

  public async paginate(options: PaginationOptions): Promise<PaginatedResult<IAuditSolaireSimulation>> {
    const page = Number.isFinite(options.page) && options.page && options.page > 0 ? options.page : 1;
    const limit = Number.isFinite(options.limit) && options.limit && options.limit > 0 ? options.limit : 10;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.model.find().sort(DEFAULT_SORT).skip(skip).limit(limit).exec(),
      this.model.countDocuments().exec()
    ]);

    return {
      data: documents.map((doc) => this.dataAdapter.fromDBtoBO(doc)),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    };
  }
}

export const auditSolaireSimulationRepository = new AuditSolaireSimulationRepository();
