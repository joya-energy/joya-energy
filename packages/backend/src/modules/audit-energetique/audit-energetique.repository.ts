import CommonRepository from '@backend/modules/common/common.repository';
import {
  type IAuditEnergetiqueSimulation,
  type ICreateAuditEnergetiqueSimulation      ,
  type IUpdateAuditEnergetiqueSimulation
} from '@shared/interfaces/audit-energetique.interface';
import {
  AuditEnergetiqueSimulation,
  type AuditEnergetiqueSimulationDocument
} from '@backend/models/audit-energetique/audit-energetique-simulation.model';

export class AuditEnergetiqueSimulationRepository extends CommonRepository<
  IAuditEnergetiqueSimulation,
  AuditEnergetiqueSimulationDocument,
  ICreateAuditEnergetiqueSimulation,
  IUpdateAuditEnergetiqueSimulation 
> {
  constructor() {
    super(AuditEnergetiqueSimulation);
  }
}
