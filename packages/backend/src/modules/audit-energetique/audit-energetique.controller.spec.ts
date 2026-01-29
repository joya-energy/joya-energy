import { Request, Response } from 'express';
import { AuditEnergetiqueSimulationController } from './audit-energetique.controller';
import { auditSimulationService } from './audit-energetique.service';
import { HTTP400Error, HTTP404Error } from '@backend/errors/http.error';
import { HttpStatusCode } from '@shared';
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
import { EnergyTariffTypes } from '@shared/enums/audit-energetique.enum';
import { LightingTypes, EquipmentCategories } from '@shared/enums/audit-usage.enum';
import { Types } from 'mongoose';

// Mock the service
jest.mock('../../../modules/audit-energetique/audit-energetique.service', () => ({
  auditSimulationService: {
    createSimulation: jest.fn(),
    getSimulationById: jest.fn(),
    deleteSimulation: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../middlewares', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('AuditEnergetiqueSimulationController', () => {
  let controller: AuditEnergetiqueSimulationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;

  const validRequestBody = {
    firstName: 'Ahmed',
    lastName: 'Ben Salem',
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
    lightingType: LightingTypes.LED
  };

  const mockSimulation = {
    id: new Types.ObjectId().toHexString(),
    ...validRequestBody,
    annualConsumption: 12500.5,
    monthlyConsumption: 1041.71,
    energyCostPerYear: 4375.18,
    co2EmissionsKg: 6400.26,
    co2EmissionsTons: 6.4,
    existingMeasures: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    controller = new AuditEnergetiqueSimulationController();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: jest.fn() });
    mockSend = jest.fn();
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
      send: mockSend
    };
    
    mockRequest = {
      body: {},
      params: {}
    };
  });

  describe('createSimulation', () => {
    it('should create simulation and return 201 with structured response', async () => {
      mockRequest.body = validRequestBody;
      (auditSimulationService.createSimulation as jest.Mock).mockResolvedValue(mockSimulation);

      await controller.createSimulation(mockRequest as Request, mockResponse as Response);

      expect(auditSimulationService.createSimulation).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: validRequestBody.firstName,
          email: validRequestBody.email
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(HttpStatusCode.CREATED);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            simulationId: mockSimulation.id,
            contact: expect.any(Object),
            building: expect.any(Object),
            results: expect.any(Object)
          })
        })
      );
    });

    it('should throw HTTP400Error for invalid email', async () => {
      mockRequest.body = {
        ...validRequestBody,
        email: 'invalid-email'
      };

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });

    it('should throw HTTP400Error for missing required fields', async () => {
      mockRequest.body = {
        firstName: 'Ahmed',
        // Missing other required fields
      };

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });

    it('should throw HTTP400Error for invalid surface area', async () => {
      mockRequest.body = {
        ...validRequestBody,
        surfaceArea: -10
      };

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });

    it('should throw HTTP400Error for invalid opening hours', async () => {
      mockRequest.body = {
        ...validRequestBody,
        openingHoursPerDay: 25
      };

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });

    it('should throw HTTP400Error for invalid opening days', async () => {
      mockRequest.body = {
        ...validRequestBody,
        openingDaysPerWeek: 8
      };

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });

    it('should validate hasRecentBill requires recentBillConsumption', async () => {
      mockRequest.body = {
        ...validRequestBody,
        hasRecentBill: true,
        recentBillConsumption: undefined
      };

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });

    it('should accept optional fields when not required', async () => {
      const minimalBody = {
        ...validRequestBody,
        equipmentCategories: undefined,
        contractedPower: undefined,
        recentBillConsumption: undefined,
        billAttachmentUrl: undefined,
        existingMeasures: undefined,
        hasRecentBill: false
      };

      mockRequest.body = minimalBody;
      (auditSimulationService.createSimulation as jest.Mock).mockResolvedValue(mockSimulation);

      await controller.createSimulation(mockRequest as Request, mockResponse as Response);

      expect(auditSimulationService.createSimulation).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(HttpStatusCode.CREATED);
    });

    it('should handle service errors gracefully', async () => {
      mockRequest.body = validRequestBody;
      (auditSimulationService.createSimulation as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        controller.createSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });
  });

  describe('getSimulationById', () => {
    it('should return simulation when found', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRequest.params = { id: simulationId };
      (auditSimulationService.getSimulationById as jest.Mock).mockResolvedValue(mockSimulation);

      await controller.getSimulationById(mockRequest as Request, mockResponse as Response);

      expect(auditSimulationService.getSimulationById).toHaveBeenCalledWith(simulationId);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            simulationId: mockSimulation.id
          })
        })
      );
    });

    it('should throw HTTP404Error when simulation not found', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRequest.params = { id: simulationId };
      (auditSimulationService.getSimulationById as jest.Mock).mockRejectedValue(
        new HTTP404Error('Simulation not found')
      );

      await expect(
        controller.getSimulationById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP404Error);
    });
  });

  describe('deleteSimulation', () => {
    it('should delete simulation and return 204', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRequest.params = { id: simulationId };
      (auditSimulationService.deleteSimulation as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteSimulation(mockRequest as Request, mockResponse as Response);

      expect(auditSimulationService.deleteSimulation).toHaveBeenCalledWith(simulationId);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatusCode.NO_CONTENT);
    });

    it('should throw HTTP400Error when deletion fails', async () => {
      const simulationId = new Types.ObjectId().toHexString();
      mockRequest.params = { id: simulationId };
      (auditSimulationService.deleteSimulation as jest.Mock).mockRejectedValue(
        new Error('Deletion failed')
      );

      await expect(
        controller.deleteSimulation(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(HTTP400Error);
    });
  });
});
