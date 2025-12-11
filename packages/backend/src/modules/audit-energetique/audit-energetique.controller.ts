import { type Request, type Response } from 'express';
import { type AuditEnergetiqueCreateInput } from './audit-energetique.service';
import { HttpStatusCode } from '@shared';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { auditSimulationService } from './audit-energetique.service';
import { billExtractionService } from './bill-extraction.service';
import {
  type AuditEnergetiqueResponseDto,
  toAuditEnergetiqueResponseDto
} from './dto/audit-energetique-response.dto';
import {
  BuildingTypes,
  ClimateZones,
  Governorates
} from '@shared/enums/audit-general.enum';
import {
  ConditionedCoverage,
  CoolingSystemTypes,
  DomesticHotWaterTypes,
  GlazingTypes,
  HeatingSystemTypes,
  InsulationQualities,
  VentilationSystems
} from '@shared/enums/audit-batiment.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energetique.enum';
import { EquipmentCategories, ExistingMeasures, LightingTypes } from '@shared/enums/audit-usage.enum';
import {
  enumArray,
  optionalNumber,
  optionalUrl,
  requireBoolean,
  requireEmail,
  requireEnum,
  requireNumber,
  requireString
} from '../common/validation.utils';

export class AuditEnergetiqueSimulationController {
  private static normalizeString(value?: string): string | undefined {
    return value?.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  private static matchGovernorate(value?: string): Governorates | undefined {
    if (!value) return undefined;
    const normalized = this.normalizeString(value);
    return (Object.values(Governorates) as string[]).find((gov) => {
      return this.normalizeString(gov) === normalized;
    }) as Governorates | undefined;
  }

  private static mapExtractedField<T>(container?: { value?: T }): T | undefined {
    return container?.value ?? undefined;
  }

  private static applyExtractedValues(
    body: Record<string, unknown>,
    extracted: Record<string, { value?: unknown } | undefined>
  ): Record<string, unknown> {
    const result = { ...body };
    const setIfMissing = (field: string, value?: any): void => {
      if (value == null) return;
      const current = result[field];
      if (current === undefined || current === null || current === '') {
        result[field] = value;
      }
    };

    setIfMissing('monthlyBillAmount', this.mapExtractedField(extracted.monthlyBillAmount));
    setIfMissing('recentBillConsumption', this.mapExtractedField(extracted.recentBillConsumption));
    setIfMissing('tariffType', this.mapExtractedField(extracted.tariffType));
    setIfMissing('contractedPower', this.mapExtractedField(extracted.contractedPower));
    setIfMissing('address', this.mapExtractedField(extracted.address));
    const governorate = this.matchGovernorate(this.mapExtractedField(extracted.governorate) as string);
    setIfMissing('governorate', governorate);

    if (result.hasRecentBill === undefined) {
      result.hasRecentBill = true;
    }

    return result;
  }

  private static sanitizeAuditPayload(payload: Record<string, unknown>): AuditEnergetiqueCreateInput {
    const hasRecentBill =
      payload.hasRecentBill === undefined
        ? true
        : requireBoolean(payload.hasRecentBill, 'hasRecentBill');

    const equipmentCategories = enumArray(
      EquipmentCategories,
      payload.equipmentCategories,
      'equipmentCategories'
    );

    const existingMeasures = enumArray(
      ExistingMeasures,
      payload.existingMeasures,
      'existingMeasures'
    );

    const sanitized: AuditEnergetiqueCreateInput = {
      fullName: requireString(payload.fullName, 'fullName'),
      companyName: requireString(payload.companyName, 'companyName'),
      email: requireEmail(payload.email, 'email'),
      phoneNumber: requireString(payload.phoneNumber, 'phoneNumber'),
      address: requireString(payload.address, 'address'),
      governorate: requireEnum(Governorates, payload.governorate, 'governorate'),
      buildingType: requireEnum(BuildingTypes, payload.buildingType, 'buildingType'),
      surfaceArea: requireNumber(payload.surfaceArea, 'surfaceArea', { min: 0 }),
      floors: requireNumber(payload.floors, 'floors', { min: 0, integer: true }),
      activityType: requireString(payload.activityType, 'activityType'),
      openingDaysPerWeek: requireNumber(payload.openingDaysPerWeek, 'openingDaysPerWeek', {
        min: 1,
        max: 7,
        integer: true
      }),
      openingHoursPerDay: requireNumber(payload.openingHoursPerDay, 'openingHoursPerDay', {
        min: 1,
        max: 24,
        integer: true
      }),
      insulation: requireEnum(InsulationQualities, payload.insulation, 'insulation'),
      glazingType: requireEnum(GlazingTypes, payload.glazingType, 'glazingType'),
      ventilation: requireEnum(VentilationSystems, payload.ventilation, 'ventilation'),
      climateZone: requireEnum(ClimateZones, payload.climateZone, 'climateZone'),
      heatingSystem: requireEnum(HeatingSystemTypes, payload.heatingSystem, 'heatingSystem'),
      coolingSystem: requireEnum(CoolingSystemTypes, payload.coolingSystem, 'coolingSystem'),
      conditionedCoverage: requireEnum(
        ConditionedCoverage,
        payload.conditionedCoverage,
        'conditionedCoverage'
      ),
      domesticHotWater: requireEnum(
        DomesticHotWaterTypes,
        payload.domesticHotWater,
        'domesticHotWater'
      ),
      equipmentCategories,
      tariffType: requireEnum(EnergyTariffTypes, payload.tariffType, 'tariffType'),
      contractedPower: optionalNumber(payload.contractedPower, 'contractedPower', { min: 0 }),
      monthlyBillAmount: requireNumber(payload.monthlyBillAmount, 'monthlyBillAmount', { min: 0 }),
      hasRecentBill,
      recentBillConsumption: hasRecentBill
        ? requireNumber(payload.recentBillConsumption, 'recentBillConsumption', { min: 0 })
        : undefined,
      billAttachmentUrl: optionalUrl(payload.billAttachmentUrl, 'billAttachmentUrl'),
      existingMeasures,
      lightingType: requireEnum(LightingTypes, payload.lightingType, 'lightingType')
    };

    return sanitized;
  }

  public createSimulation = async (req: Request, res: Response<AuditEnergetiqueResponseDto>): Promise<void> => {
    try {
      const input = AuditEnergetiqueSimulationController.sanitizeAuditPayload(req.body);
      const simulation = await auditSimulationService.createSimulation(input);
      
      // Transform to structured response
      const response = toAuditEnergetiqueResponseDto(simulation);
      
      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }

      Logger.error(`Error: Audit energetique simulation not created: ${String(error)}`);
      throw new HTTP400Error('Error: Audit energetique simulation not created', error);
    }
  };

  public createSimulationWithBill = async (req: Request, res: Response<AuditEnergetiqueResponseDto>): Promise<void> => {
    try {
      if (!req.file) {
        throw new HTTP400Error('No bill file uploaded. Please provide an image or PDF file.');
      }

      const extracted = await billExtractionService.extractDataFromImage(req.file.buffer, req.file.mimetype);
      const mergedBody = AuditEnergetiqueSimulationController.applyExtractedValues(req.body, extracted);

      const input = AuditEnergetiqueSimulationController.sanitizeAuditPayload(mergedBody);
      const simulation = await auditSimulationService.createSimulation(input);
      const response = toAuditEnergetiqueResponseDto(simulation);
      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      if (error instanceof HTTP400Error) {
        throw error;
      }
      Logger.error(`Error: Audit energetique simulation (full upload) failed: ${String(error)}`);
      throw new HTTP400Error('Error: Audit energetique simulation not created', error);
    }
  };

  public getSimulationById = async (req: Request, res: Response<AuditEnergetiqueResponseDto>): Promise<void> => {
    try {
      const { id } = req.params;
      const simulation = await auditSimulationService.getSimulationById(id);
      
      // Transform to structured response
      const response = toAuditEnergetiqueResponseDto(simulation);
      
      res.status(HttpStatusCode.OK).json(response);
    } catch (error) {
      Logger.error(`Error: Audit energetique simulation not found: ${String(error)}`);
      throw new HTTP404Error('Error: Audit energetique simulation not found', error);
    }
  };

  public deleteSimulation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await auditSimulationService.deleteSimulation(id);
      res.status(HttpStatusCode.NO_CONTENT).send();
    } catch (error) {
      Logger.error(`Error: Audit energetique simulation not deleted: ${String(error)}`);
      throw new HTTP400Error('Error: Audit energetique simulation not deleted', error);
    }
  };
}

export const auditEnergetiqueSimulationController = new AuditEnergetiqueSimulationController();
