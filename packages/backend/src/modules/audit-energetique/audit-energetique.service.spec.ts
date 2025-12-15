import { AuditSimulationService, type AuditEnergetiqueCreateInput } from './audit-energetique.service';
import { AuditEnergetiqueSimulationRepository } from './audit-energetique.repository';
import { HTTP404Error } from '@backend/errors/http.error';
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
import { LightingTypes, EquipmentCategories } from '@shared/enums/audit-usage.enum';
import { Types } from 'mongoose';
import {
  type IAuditEnergetiqueSimulation,
  type ICreateAuditEnergetiqueSimulation
} from '@shared/interfaces/audit-energetique.interface';

// Mock the repository
jest.mock('./audit-energetique.repository');

// Mock the logger
jest.mock('@backend/middlewares', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock environment variables
process.env.ENERGY_AUDIT_K_CH = '0.2';
process.env.ENERGY_AUDIT_K_FR = '0.3';
process.env.ENERGY_AUDIT_ECS_GAS_EFF = '0.92';
process.env.ENERGY_AUDIT_ECS_SOLAR_COVERAGE = '0.7';
process.env.ENERGY_AUDIT_ECS_SOLAR_APPOINT_EFF = '0.9';
process.env.ENERGY_AUDIT_ECS_PAC_COP = '3.0';
process.env.ENERGY_COST_PER_KWH = '0.35';

describe('AuditSimulationService', () => {
  let service: AuditSimulationService;
  let mockRepository: jest.Mocked<AuditEnergetiqueSimulationRepository>;

  const mockSimulationInput: AuditEnergetiqueCreateInput = {
    fullName: 'Ahmed Ben Salem',
    companyName: 'Pharmacie Centrale',
    email: 'ahmed@pharmacie.tn',
    phoneNumber: '20123456',
    address: '123 Avenue Bourguiba',
    governorate: Governorates.TUNIS,
    buildingType: BuildingTypes.PHARMACY,
    surfaceArea: 100,
    floors: 1,
    activityType: 'Pharmacie',
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
    equipmentCategories: [EquipmentCategories.COMMERCIAL_COOLING],
    tariffType: EnergyTariffTypes.BT,
    monthlyBillAmount: 450,
    hasRecentBill: true,
    recentBillConsumption: 1200,
    existingMeasures: [],
    lightingType: LightingTypes.LED
  };

  const mockSimulationDocument: IAuditEnergetiqueSimulation = {
    id: new Types.ObjectId().toHexString(),
    ...mockSimulationInput,
    annualConsumption: 12500.5,
    monthlyConsumption: 1041.71,
    energyCostPerYear: 4375.18,
    co2EmissionsKg: 6400.26,
    co2EmissionsTons: 6.4,
    energyClass: undefined,
    energyClassDescription: undefined,
    becth: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository instance
    mockRepository = new AuditEnergetiqueSimulationRepository() as jest.Mocked<AuditEnergetiqueSimulationRepository>;
    
    // Setup mock implementations
    mockRepository.createOne = jest.fn();
    mockRepository.getById = jest.fn();
    mockRepository.deleteOne = jest.fn();
    
    // Create service with mocked repository
    service = new AuditSimulationService();
    (service as unknown as { repository: AuditEnergetiqueSimulationRepository }).repository = mockRepository;
  });

  describe('createSimulation', () => {
    it('should create a simulation with calculated energy consumption', async () => {
      mockRepository.createOne.mockResolvedValue(mockSimulationDocument);

      const result = await service.createSimulation(mockSimulationInput);

      expect(mockRepository.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: mockSimulationInput.fullName,
          annualConsumption: expect.any(Number),
          monthlyConsumption: expect.any(Number),
          energyCostPerYear: expect.any(Number),
          co2EmissionsKg: expect.any(Number),
          co2EmissionsTons: expect.any(Number)
        })
      );
      expect(result).toBeDefined();
      expect(result.annualConsumption).toBeGreaterThan(0);
    });

    it('should calculate energy class for office buildings', async () => {
      const officeInput = {
        ...mockSimulationInput,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK
      };

      const officeSimulation: IAuditEnergetiqueSimulation = {
        ...mockSimulationDocument,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        energyClass: 'Classe 3',
        energyClassDescription: 'Bonne performance',
        becth: 95.5
      };

      mockRepository.createOne.mockResolvedValue(officeSimulation);

      const result = await service.createSimulation(officeInput);

      expect(result.energyClass).toBeDefined();
      expect(result.becth).toBeDefined();
    });

    it('should calculate energy class for all supported building types', async () => {
      mockRepository.createOne.mockResolvedValue(mockSimulationDocument);

      await service.createSimulation(mockSimulationInput);

      const createCall = mockRepository.createOne.mock.calls[0][0] as ICreateAuditEnergetiqueSimulation;
      // Pharmacy is supported: energy class should be computed, not N/A
      expect(createCall.energyClass).toBeDefined();
      expect(createCall.energyClass).not.toBe('N/A');
      expect(createCall.becth).toBeDefined();
      expect(createCall.totalAnnualEnergy).toBeDefined();
      expect(createCall.siteIntensity).toBeDefined();
      expect(createCall.joyaIndex).toBeDefined();
    });

    it('should include equipment loads when categories provided', async () => {
      const inputWithEquipment = {
        ...mockSimulationInput,
        equipmentCategories: [
          EquipmentCategories.COMMERCIAL_COOLING,
          EquipmentCategories.OFFICE
        ]
      };

      mockRepository.createOne.mockResolvedValue(mockSimulationDocument);

      const result = await service.createSimulation(inputWithEquipment);

      expect(result.annualConsumption).toBeGreaterThan(0);
      expect(mockRepository.createOne).toHaveBeenCalled();
    });

    it('should handle empty equipment categories', async () => {
      const inputWithoutEquipment = {
        ...mockSimulationInput,
        equipmentCategories: []
      };

      mockRepository.createOne.mockResolvedValue(mockSimulationDocument);

      const result = await service.createSimulation(inputWithoutEquipment);

      expect(result).toBeDefined();
      expect(mockRepository.createOne).toHaveBeenCalled();
    });

    it('should calculate CO2 emissions correctly', async () => {
      mockRepository.createOne.mockResolvedValue(mockSimulationDocument);

      await service.createSimulation(mockSimulationInput);

      const createCall = mockRepository.createOne.mock.calls[0][0] as ICreateAuditEnergetiqueSimulation;
      expect(createCall.co2EmissionsKg).toBeGreaterThan(0);
      expect(createCall.co2EmissionsTons).toBe(Number((createCall.co2EmissionsKg / 1000).toFixed(3)));
    });

    it('should apply pharmacy-specific cold load', async () => {
      const pharmacyInput = {
        ...mockSimulationInput,
        buildingType: BuildingTypes.PHARMACY,
        surfaceArea: 80
      };

      const pharmacySimulation: IAuditEnergetiqueSimulation = {
        ...mockSimulationDocument,
        surfaceArea: 80
      };

      mockRepository.createOne.mockResolvedValue(pharmacySimulation);

      const result = await service.createSimulation(pharmacyInput);

      // Pharmacy should have additional cold load factored in
      expect(result.annualConsumption).toBeGreaterThan(0);
      expect(mockRepository.createOne).toHaveBeenCalled();
    });
  });

  describe('getSimulationById', () => {
    it('should return simulation when found', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRepository.getById.mockResolvedValue(mockSimulationDocument);

      const result = await service.getSimulationById(simulationId);

      expect(mockRepository.getById).toHaveBeenCalledWith(simulationId, {});
      expect(result).toEqual(mockSimulationDocument);
    });

    it('should throw HTTP404Error when simulation not found', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRepository.getById.mockResolvedValue(null);

      await expect(service.getSimulationById(simulationId)).rejects.toThrow(HTTP404Error);
      await expect(service.getSimulationById(simulationId)).rejects.toThrow('Audit simulation not found');
    });
  });

  describe('deleteSimulation', () => {
    it('should delete simulation successfully', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRepository.deleteOne.mockResolvedValue(true);

      await service.deleteSimulation(simulationId);

      expect(mockRepository.deleteOne).toHaveBeenCalledWith(simulationId);
    });

    it('should throw HTTP404Error when simulation not found', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRepository.deleteOne.mockResolvedValue(false);

      await expect(service.deleteSimulation(simulationId)).rejects.toThrow(HTTP404Error);
      await expect(service.deleteSimulation(simulationId)).rejects.toThrow('Audit simulation not found');
    });
  });
});
