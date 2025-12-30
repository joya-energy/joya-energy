import { toAuditEnergetiqueResponseDto } from './audit-energetique-response.dto';
import { BuildingTypes, ClimateZones, Governorates } from '@shared/enums/audit-general.enum';
import {
  InsulationQualities,
  GlazingTypes,
  VentilationSystems,
  HeatingSystemTypes,
  CoolingSystemTypes,
  ConditionedCoverage,
  DomesticHotWaterTypes
} from '@shared/enums/audit-batiment.enum';
import { EnergyTariffTypes } from '@shared/enums/audit-energy-tariff';
import { LightingTypes } from '@shared/enums/audit-usage.enum';
import { type IAuditEnergetiqueSimulation } from '@shared/interfaces/audit-energetique.interface';

describe('toAuditEnergetiqueResponseDto', () => {
  const mockSimulation: IAuditEnergetiqueSimulation = {
    id: '507f1f77bcf86cd799439011',
    fullName: 'Ahmed Ben Salem',
    companyName: 'Office Central',
    email: 'ahmed@office.tn',
    phoneNumber: '20123456',
    address: '123 Avenue Bourguiba',
    governorate: Governorates.TUNIS,
    buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
    surfaceArea: 100,
    floors: 1,
    activityType: 'Bureau / Administration / Banque',
    openingDaysPerWeek: 6,
    openingHoursPerDay: 10,
    insulation: InsulationQualities.MEDIUM,
    glazingType: GlazingTypes.DOUBLE,
    ventilation: VentilationSystems.NONE,
    climateZone: ClimateZones.NORTH,
    heatingSystem: HeatingSystemTypes.REVERSIBLE_AC,
    coolingSystem: CoolingSystemTypes.SPLIT,
    conditionedCoverage: ConditionedCoverage.MOST_BUILDING,
    domesticHotWater: DomesticHotWaterTypes.ELECTRIC,
    equipmentCategories: [],
    tariffType: EnergyTariffTypes.BT,
    monthlyBillAmount: 450,
    hasRecentBill: true,
    recentBillConsumption: 1200,
    lightingType: LightingTypes.LED,
    existingMeasures: [],
    annualConsumption: 12500.5,
    monthlyConsumption: 1041.71,
    energyCostPerYear: 4375.18,
    co2EmissionsKg: 6400.26,
    co2EmissionsTons: 6.4,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  };

  it('should transform simulation to structured DTO', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        simulationId: mockSimulation.id,
        createdAt: mockSimulation.createdAt.toISOString()
      }),
      metadata: expect.objectContaining({
        version: expect.any(String),
        calculationDate: expect.any(String)
      })
    });
  });

  it('should include contact information', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.contact).toEqual({
      fullName: 'Ahmed Ben Salem',
      companyName: 'Office Central',
      email: 'ahmed@office.tn',
      phoneNumber: '20123456',
      address: '123 Avenue Bourguiba',
      governorate: Governorates.TUNIS
    });
  });

  it('should include building characteristics', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.building).toEqual({
      type: BuildingTypes.OFFICE_ADMIN_BANK,
      surfaceArea: 100,
      floors: 1,
      activityType: 'Bureau / Administration / Banque',
      openingHoursPerDay: 10,
      openingDaysPerWeek: 6
    });
  });

  it('should include building envelope information', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.envelope).toEqual({
      insulation: InsulationQualities.MEDIUM,
      glazingType: GlazingTypes.DOUBLE,
      ventilation: VentilationSystems.NONE,
      climateZone: ClimateZones.NORTH
    });
  });

  it('should include energy systems information', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.systems).toEqual({
      heating: HeatingSystemTypes.REVERSIBLE_AC,
      cooling: CoolingSystemTypes.SPLIT,
      conditionedCoverage: ConditionedCoverage.MOST_BUILDING,
      domesticHotWater: DomesticHotWaterTypes.ELECTRIC,
      equipmentCategories: [],
      lightingType: LightingTypes.LED
    });
  });

  it('should include energy end-use breakdown when provided', () => {
    const simWithBreakdown: IAuditEnergetiqueSimulation = {
      ...mockSimulation,
      energyEndUseBreakdown: {
        totalConsumptionKwh: 12500.5,
        totalCostTnd: 4375.18,
        breakdown: {
          cooling: { consumptionKwh: 2000, costTnd: 700, sharePercent: 16 },
          heating: { consumptionKwh: 3000, costTnd: 1050, sharePercent: 24 },
          lighting: { consumptionKwh: 1500, costTnd: 525, sharePercent: 12 },
          equipment: { consumptionKwh: 5000, costTnd: 1750, sharePercent: 40 },
          dhw: { consumptionKwh: 1000, costTnd: 350, sharePercent: 8 }
        }
      }
    };

    const result = toAuditEnergetiqueResponseDto(simWithBreakdown);

    expect(result.data.results.energyEndUseBreakdown).toEqual(simWithBreakdown.energyEndUseBreakdown);
  });

  it('should calculate energy consumption per m²', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.results.energyConsumption.perSquareMeter.value).toBeCloseTo(125, 0);
    expect(result.data.results.energyConsumption.perSquareMeter.unit).toBe('kWh/m².an');
  });

  it('should calculate CO2 emissions per m²', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.results.co2Emissions.perSquareMeter).toEqual({
      value: 64,
      unit: 'kg CO₂/m².an'
    });
  });

  it('should calculate monthly energy cost', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.results.energyCost.monthly).toEqual({
      value: 364.6,
      unit: 'TND/mois'
    });
  });

  it('should include energy classification for office buildings', () => {
    const officeSimulation: IAuditEnergetiqueSimulation = {
      ...mockSimulation,
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
      energyClass: 'Classe 3',
      energyClassDescription: 'Bonne performance',
      becth: 95.5,
      totalAnnualEnergy: 125,
      siteIntensity: 125
    };

    const result = toAuditEnergetiqueResponseDto(officeSimulation);

    expect(result.data.results.energyClassification).toMatchObject({
      becth: 95.5,
      class: 'Classe 3',
      description: 'Bonne performance',
      isApplicable: true
    });
  });

  it('should mark energy classification as not applicable for non-office buildings', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.results.energyClassification).toMatchObject({
      class: 'N/A',
      description: 'Classement énergétique non disponible pour ce type de bâtiment',
      isApplicable: false
    });
    expect(result.data.results.energyClassification?.becth).toBeGreaterThan(0);
  });

  it('should handle simulation with optional fields', () => {
    const simWithOptionals: IAuditEnergetiqueSimulation = {
      ...mockSimulation,
      contractedPower: 15,
      billAttachmentUrl: 'https://example.com/bill.pdf'
    };

    const result = toAuditEnergetiqueResponseDto(simWithOptionals);

    expect(result.data.billing.contractedPower).toBe(15);
    expect(result.data.billing.billAttachmentUrl).toBe('https://example.com/bill.pdf');
  });

  it('should handle simulation without optional fields', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.billing.contractedPower).toBeUndefined();
    expect(result.data.billing.billAttachmentUrl).toBeUndefined();
  });

  it('should include correct units for all measurements', () => {
    const result = toAuditEnergetiqueResponseDto(mockSimulation);

    expect(result.data.results.energyConsumption.annual.unit).toBe('kWh/an');
    expect(result.data.results.energyConsumption.monthly.unit).toBe('kWh/mois');
    expect(result.data.results.energyConsumption.perSquareMeter.unit).toBe('kWh/m².an');
    expect(result.data.results.co2Emissions.annual.unit).toBe('kg CO₂/an');
    expect(result.data.results.co2Emissions.perSquareMeter.unit).toBe('kg CO₂/m².an');
    expect(result.data.results.energyCost.annual.unit).toBe('TND/an');
    expect(result.data.results.energyCost.monthly.unit).toBe('TND/mois');
  });

  it('should round calculated values appropriately', () => {
    const simWithFractionalValues: IAuditEnergetiqueSimulation = {
      ...mockSimulation,
      surfaceArea: 123.456,
      annualConsumption: 15432.789,
      co2EmissionsKg: 7896.543
    };

    const result = toAuditEnergetiqueResponseDto(simWithFractionalValues);

    expect(result.data.results.energyConsumption.perSquareMeter.value).toBeCloseTo(125.01, 2);
    expect(result.data.results.co2Emissions.perSquareMeter.value).toBeCloseTo(63.96, 2);
  });
});
