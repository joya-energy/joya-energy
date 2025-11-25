import { Router } from 'express';
import { auditSolaireSimulationController } from './audit-solaire.controller';

export const auditSolaireSimulationRoutes = Router();

auditSolaireSimulationRoutes.post('/', auditSolaireSimulationController.createSimulation);
auditSolaireSimulationRoutes.get('/', auditSolaireSimulationController.getSimulations);
auditSolaireSimulationRoutes.get('/:id', auditSolaireSimulationController.getSimulationById);
auditSolaireSimulationRoutes.delete('/:id', auditSolaireSimulationController.deleteSimulation);
