import { type Request, type Response } from 'express';
import { auditSolaireSimulationService, type CreateSimulationInput } from './audit-solaire.service';
import { HttpStatusCode, type PaginatedResult } from '@shared';
import { type IAuditSolaireSimulation } from '@shared/interfaces';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { requireNumber, requireString } from '../common/validation.utils';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';
import { billExtractionService } from '../audit-energetique/bill-extraction.service';

export class AuditSolaireSimulationController {
  public createSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = AuditSolaireSimulationController.sanitizePayload(req.body);
      const simulation = await auditSolaireSimulationService.createSimulation(input);
      res.status(HttpStatusCode.CREATED).json(simulation);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }

      Logger.error(`Error: Audit solaire simulation not created: ${String(error)}`);
      throw new HTTP400Error('Error: Audit solaire simulation not created', error);
    }
  };

  public createSimulationWithBill = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        throw new HTTP400Error('No bill file uploaded. Please provide an image or PDF file.');
      }

      // Extract data from bill image
      Logger.info('Extracting data from bill image...');
      const extracted = await billExtractionService.extractDataFromImage(req.file.buffer, req.file.mimetype);
      
      // Merge extracted data with form data
      const mergedBody = AuditSolaireSimulationController.mergeExtractedData(req.body, extracted);
      
      // Sanitize and create simulation
      const input = AuditSolaireSimulationController.sanitizePayload(mergedBody);
      const simulation = await auditSolaireSimulationService.createSimulation(input);
      
      res.status(HttpStatusCode.CREATED).json(simulation);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }
      Logger.error(`Error: Audit solaire simulation (with bill) not created: ${String(error)}`);
      throw new HTTP400Error('Error: Audit solaire simulation not created', error);
    }
  };

  public getSimulations = async (req: Request, res: Response<PaginatedResult<IAuditSolaireSimulation>>): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const simulations = await auditSolaireSimulationService.getSimulations({ page, limit });
      res.status(HttpStatusCode.OK).json(simulations);
    } catch (error) {
      Logger.error(`Error: Audit solaire simulations not found: ${String(error)}`);
      throw new HTTP404Error('Error: Audit solaire simulations not found', error);
    }
  };

  public getSimulationById = async (req: Request, res: Response<IAuditSolaireSimulation>): Promise<void> => {
    try {
      const { id } = req.params;
      const simulation = await auditSolaireSimulationService.getSimulationById(id);
      res.status(HttpStatusCode.OK).json(simulation);
    } catch (error) {
      Logger.error(`Error: Audit solaire simulation not found: ${String(error)}`);
      throw new HTTP404Error('Error: Audit solaire simulation not found', error);
    }
  };

  public deleteSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await auditSolaireSimulationService.deleteSimulation(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(`Error: Audit solaire simulation not deleted: ${String(error)}`);
      throw new HTTP400Error('Error: Audit solaire simulation not deleted', error);
    }
  };

  private static mergeExtractedData(
    body: Record<string, any>,
    extracted: any
  ): Record<string, string | number | boolean> {
    const merged: Record<string, any> = { ...body };

    // Map monthlyBillAmount to measuredAmountTnd
    if (extracted.monthlyBillAmount?.value !== undefined && !merged.measuredAmountTnd) {
      merged.measuredAmountTnd = extracted.monthlyBillAmount.value;
      Logger.info(`Extracted monthlyBillAmount: ${extracted.monthlyBillAmount.value}`);
    }

    // Derive referenceMonth from periodEnd date
    if (extracted.periodEnd?.value && !merged.referenceMonth) {
      try {
        const periodEndDate = new Date(extracted.periodEnd.value);
        const month = periodEndDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        if (month >= 1 && month <= 12) {
          merged.referenceMonth = month;
          Logger.info(`Derived referenceMonth from periodEnd: ${month}`);
        }
      } catch (error) {
        Logger.warn(`Failed to parse periodEnd date: ${extracted.periodEnd.value}`);
      }
    }

    // If still no referenceMonth, try periodStart
    if (!merged.referenceMonth && extracted.periodStart?.value) {
      try {
        const periodStartDate = new Date(extracted.periodStart.value);
        const month = periodStartDate.getMonth() + 1;
        if (month >= 1 && month <= 12) {
          merged.referenceMonth = month;
          Logger.info(`Derived referenceMonth from periodStart: ${month}`);
        }
      } catch (error) {
        Logger.warn(`Failed to parse periodStart date: ${extracted.periodStart.value}`);
      }
    }

    return merged;
  }

  private static sanitizePayload(body: Record<string, string | number | boolean>): CreateSimulationInput {
    // Handle case where buildingType might be an object instead of a string
    const buildingTypeRaw = body.buildingType;
    const buildingType = typeof buildingTypeRaw === 'string' 
      ? buildingTypeRaw 
      : (typeof buildingTypeRaw === 'object' && buildingTypeRaw !== null && 'id' in buildingTypeRaw
        ? (buildingTypeRaw as { id: string }).id
        : String(buildingTypeRaw));
    
    if (!Object.values(BuildingTypes).includes(buildingType as BuildingTypes)) {
      throw new HTTP400Error(`Invalid building type: ${buildingType}`);
    }

    // Handle case where climateZone might be an object instead of a string
    const climateZoneRaw = body.climateZone;
    const climateZone = typeof climateZoneRaw === 'string'
      ? climateZoneRaw
      : (typeof climateZoneRaw === 'object' && climateZoneRaw !== null && 'id' in climateZoneRaw
        ? (climateZoneRaw as { id: string }).id
        : String(climateZoneRaw));
    
    if (!Object.values(ClimateZones).includes(climateZone as ClimateZones)) {
      throw new HTTP400Error(`Invalid climate zone: ${climateZone}`);
    }

    const referenceMonth = requireNumber(body.referenceMonth, 'referenceMonth', { min: 1, max: 12 });
    const email = requireString(body.email, 'email');
    // Basic email validation (kept simple and explicit)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HTTP400Error('Invalid email format');
    }

    return {
      address: requireString(body.address, 'address'),
      fullName: requireString(body.fullName, 'fullName'),
      companyName: requireString(body.companyName, 'companyName'),
      email,
      phoneNumber: requireString(body.phoneNumber, 'phoneNumber'),
      buildingType: buildingType as BuildingTypes,
      climateZone: climateZone as ClimateZones,
      measuredAmountTnd: requireNumber(body.measuredAmountTnd, 'measuredAmountTnd', { min: 0 }),
      referenceMonth,
    };
  }
}

export const auditSolaireSimulationController = new AuditSolaireSimulationController();
