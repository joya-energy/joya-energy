import { ConditionedCoverage,
  CoolingSystemTypes,
  DomesticHotWaterTypes,
  GlazingTypes,
  HeatingSystemTypes,
  InsulationQualities,
  VentilationSystems
} from '../enums/audit-batiment.enum';
import { BusinessObject, CreateBusinessObject, UpdateBusinessObject } from './buisness.interface';
import { BuildingTypes, ClimateZones, Governorates } from '@shared/enums/audit-general.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energy-tariff';
import { EquipmentCategories, ExistingMeasures, LightingTypes } from '@shared/enums/audit-usage.enum';

export interface IAuditEnergetiqueSimulation extends BusinessObject {
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  governorate: Governorates;
  buildingType: BuildingTypes;
  surfaceArea: number;
  floors: number;
  activityType: string;
  openingDaysPerWeek: number;
  openingHoursPerDay: number;
  insulation: InsulationQualities;
  glazingType: GlazingTypes;
  ventilation: VentilationSystems;
  climateZone: ClimateZones;
  heatingSystem: HeatingSystemTypes;
  coolingSystem: CoolingSystemTypes;
  conditionedCoverage: ConditionedCoverage;
  domesticHotWater: DomesticHotWaterTypes;
  equipmentCategories: EquipmentCategories[];
  tariffType: EnergyTariffTypes;
  contractedPower?: number;
  monthlyBillAmount: number;
  hasRecentBill: boolean;
  recentBillConsumption?: number;
  billAttachmentUrl?: string;
  existingMeasures: ExistingMeasures[];
  lightingType: LightingTypes;
  annualConsumption: number;
  monthlyConsumption: number;
  energyCostPerYear: number;
  co2EmissionsKg: number;
  co2EmissionsTons: number;
  energyEndUseBreakdown?: {
    totalConsumptionKwh: number;
    totalCostTnd: number;
    breakdown: {
      cooling: { consumptionKwh: number; costTnd: number; sharePercent: number };
      heating: { consumptionKwh: number; costTnd: number; sharePercent: number };
      lighting: { consumptionKwh: number; costTnd: number; sharePercent: number };
      equipment: { consumptionKwh: number; costTnd: number; sharePercent: number };
      dhw: { consumptionKwh: number; costTnd: number; sharePercent: number };
    };
  };
  co2EmissionsElecKg?: number;
  co2EmissionsGasKg?: number;
  carbonClass?: string;
  carbonClassDescription?: string;
  carbonIntensity?: number;
  energyClass?: string;
  energyClassDescription?: string;
  totalAnnualEnergy?: number;
  siteIntensity?: number;
  referenceIntensity?: number;
  joyaIndex?: number;
  becth?: number;
  createdAt: Date;
  updatedAt: Date;
}

type ReadOnlyProperties = Pick<IAuditEnergetiqueSimulation, 'createdAt' | 'updatedAt'>;

export type ICreateAuditEnergetiqueSimulation = CreateBusinessObject<IAuditEnergetiqueSimulation, ReadOnlyProperties>;
export type IUpdateAuditEnergetiqueSimulation = UpdateBusinessObject<IAuditEnergetiqueSimulation, ReadOnlyProperties>;
