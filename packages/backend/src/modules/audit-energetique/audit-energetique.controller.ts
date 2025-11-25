import { type Request, type Response } from 'express';
import { type AuditEnergetiqueCreateInput } from './audit-energetique.service';
import { HttpStatusCode } from '@shared';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { Logger } from '@backend/middlewares';
import { auditSimulationService } from './audit-energetique.service';
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
import { z } from 'zod';

const createAuditEnergetiqueSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  companyName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().min(3),
  address: z.string().trim().min(3),
  governorate: z.nativeEnum(Governorates),
  buildingType: z.nativeEnum(BuildingTypes),
  surfaceArea: z.coerce.number().positive(),
  floors: z.coerce.number().int().min(0),
  activityType: z.string().trim().min(1),
  openingDaysPerWeek: z.coerce.number().int().min(1).max(7),
  openingHoursPerDay: z.coerce.number().int().min(1).max(24),
  insulation: z.nativeEnum(InsulationQualities),
  glazingType: z.nativeEnum(GlazingTypes),
  ventilation: z.nativeEnum(VentilationSystems),
  climateZone: z.nativeEnum(ClimateZones),
  heatingSystem: z.nativeEnum(HeatingSystemTypes),
  coolingSystem: z.nativeEnum(CoolingSystemTypes),
  conditionedCoverage: z.nativeEnum(ConditionedCoverage),
  domesticHotWater: z.nativeEnum(DomesticHotWaterTypes),
  equipmentCategories: z.array(z.nativeEnum(EquipmentCategories)).optional(),
  tariffType: z.nativeEnum(EnergyTariffTypes),
  contractedPower: z.coerce.number().min(0).optional(),
  monthlyBillAmount: z.coerce.number().min(0),
  hasRecentBill: z.coerce.boolean(),
  recentBillConsumption: z.coerce.number().min(0).optional(),
  billAttachmentUrl: z.string().url().optional(),
  existingMeasures: z.array(z.nativeEnum(ExistingMeasures)).optional(),
  lightingType: z.nativeEnum(LightingTypes)
}).superRefine((data, ctx) => {
  if (data.hasRecentBill && data.recentBillConsumption == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'recentBillConsumption is required when hasRecentBill is true',
      path: ['recentBillConsumption']
    });
  }
});

type CreateAuditEnergetiqueDto = z.infer<typeof createAuditEnergetiqueSchema>;

export class AuditEnergetiqueSimulationController {
  public createSimulation = async (req: Request, res: Response<AuditEnergetiqueResponseDto>): Promise<void> => {
    try {
      const input = createAuditEnergetiqueSchema.parse(req.body) as CreateAuditEnergetiqueDto;
      const simulation = await auditSimulationService.createSimulation(input as AuditEnergetiqueCreateInput);
      
      // Transform to structured response
      const response = toAuditEnergetiqueResponseDto(simulation);
      
      res.status(HttpStatusCode.CREATED).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        Logger.error(`Invalid audit énergétique request payload: ${JSON.stringify(error.errors)}`);
        throw new HTTP400Error('Invalid audit énergétique request payload', error);
      }

      Logger.error(`Error: Audit energetique simulation not created: ${String(error)}`);
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
