import { type Model, type Document } from 'mongoose';
import { type ObjectId } from 'mongodb';
import { buildSchema } from '@backend/common/BaseSchema';
import { ModelsCollection } from '@backend/enums';
import { validateEmail } from '@shared/functions/user-check';
import { HTTP401Error } from '@backend/errors/http.error';
import {
  ConditionedCoverage,
  CoolingSystemTypes,
  DomesticHotWaterTypes,
  GlazingTypes,
  HeatingSystemTypes,
  InsulationQualities,
  VentilationSystems
} from '@shared/enums/audit-batiment.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energy-tariff';
import { BuildingTypes, ClimateZones, Governorates } from '@shared/enums/audit-general.enum';
import { EquipmentCategories, ExistingMeasures, LightingTypes } from '@shared/enums/audit-usage.enum';
import { type IAuditEnergetiqueSimulation } from '@shared/interfaces/audit-energetique.interface';

export type AuditEnergetiqueSimulationDocument = IAuditEnergetiqueSimulation & Document<ObjectId>;

export const AuditEnergetiqueSimulation: Model<AuditEnergetiqueSimulationDocument> = buildSchema<AuditEnergetiqueSimulationDocument>(
  ModelsCollection.AUDIT_ENERGETIQUE_SIMULATION,
  {
    fullName: { type: String, required: true, trim: true, maxlength: 60 },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 30 },
    address: { type: String, required: true, trim: true, maxlength: 180 },
    governorate: { type: String, enum: Object.values(Governorates), required: true },
    buildingType: { type: String, enum: Object.values(BuildingTypes), required: true },
    surfaceArea: { type: Number, required: true, min: 1 },
    floors: { type: Number, required: true, min: 0 },
    activityType: { type: String, required: true, trim: true },
    openingDaysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    openingHoursPerDay: { type: Number, required: true, min: 1, max: 24 },
    insulation: { type: String, enum: Object.values(InsulationQualities), required: true },
    glazingType: { type: String, enum: Object.values(GlazingTypes), required: true },
    ventilation: { type: String, enum: Object.values(VentilationSystems), required: true },
    climateZone: { type: String, enum: Object.values(ClimateZones), required: true },
    heatingSystem: { type: String, enum: Object.values(HeatingSystemTypes), required: true },
    coolingSystem: { type: String, enum: Object.values(CoolingSystemTypes), required: true },
    conditionedCoverage: { type: String, enum: Object.values(ConditionedCoverage), required: true },
    domesticHotWater: { type: String, enum: Object.values(DomesticHotWaterTypes), required: true },
    equipmentCategories: { type: [String], enum: Object.values(EquipmentCategories), default: [] },
    tariffType: { type: String, enum: Object.values(EnergyTariffTypes), required: true },
    contractedPower: { type: Number, required: false, min: 0 },
    monthlyBillAmount: { type: Number, required: true, min: 0 },
    hasRecentBill: { type: Boolean, required: true },
    recentBillConsumption: { type: Number, required: false, min: 0 },
    billAttachmentUrl: { type: String, required: false, trim: true },
    existingMeasures: { type: [String], enum: Object.values(ExistingMeasures), default: [] },
    lightingType: { type: String, enum: Object.values(LightingTypes), required: true },
    annualConsumption: { type: Number, required: true, min: 0 },
    monthlyConsumption: { type: Number, required: true, min: 0 },
    energyCostPerYear: { type: Number, required: true, min: 0 },
    co2EmissionsKg: { type: Number, required: true, min: 0 },
    co2EmissionsTons: { type: Number, required: true, min: 0 },
    energyClass: { type: String, required: false },
    energyClassDescription: { type: String, required: false },
    totalAnnualEnergy: { type: Number, required: false, min: 0 },
    siteIntensity: { type: Number, required: false, min: 0 },
    referenceIntensity: { type: Number, required: false, min: 0 },
    joyaIndex: { type: Number, required: false, min: 0 },
    becth: { type: Number, required: false, min: 0 },


    carbonClass: { type: String, required: false },
carbonIntensity: { type: Number, required: false, min: 0 },
carbonClassDescription: { type: String, required: false },

co2EmissionsElecKg: { type: Number, required: false, min: 0 },
co2EmissionsGasKg: { type: Number, required: false, min: 0 },








    energyEndUseBreakdown: {
      breakdown: {
        cooling: {
          consumptionKwh: { type: Number, required: true, min: 0 },
          costTnd: { type: Number, required: true, min: 0 },
          sharePercent: { type: Number, required: true, min: 0 },
        },
        heating: {
          consumptionKwh: { type: Number, required: true, min: 0 },
          costTnd: { type: Number, required: true, min: 0 },
          sharePercent: { type: Number, required: true, min: 0 },
        },
        lighting: {
          consumptionKwh: { type: Number, required: true, min: 0 },
          costTnd: { type: Number, required: true, min: 0 },
          sharePercent: { type: Number, required: true, min: 0 },
        },
        equipment: {
          consumptionKwh: { type: Number, required: true, min: 0 },
          costTnd: { type: Number, required: true, min: 0 },
          sharePercent: { type: Number, required: true, min: 0 },
        },
        dhw: {
          consumptionKwh: { type: Number, required: true, min: 0 },
          costTnd: { type: Number, required: true, min: 0 },
          sharePercent: { type: Number, required: true, min: 0 },
        },
      },
      totalConsumptionKwh: { type: Number, required: true, min: 0 },
      totalCostTnd: { type: Number, required: true, min: 0 },
    },

  },
  {
    timestamps: true
  },
  (schema) => {
    schema.pre('save', async function () {
      if (!validateEmail(this.email)) {
        throw new HTTP401Error('Wrong Email format');
      }
    });
  }
);
