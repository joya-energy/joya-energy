import {
  calculateThermalScope1,
  type ThermalScope1Input,
  type HeatUsageKey,
  type HeatEnergyType,
} from './thermal-scope1.calculator';
import {
  calculateColdScope1,
  type ColdScope1Input,
} from './cold-scope1.calculator';
import {
  calculateVehiclesScope1,
  type VehiclesScope1Input,
} from './vehicles-scope1.calculator';
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import {
  ColdType,
  IntensityLevel,
  EquipmentAge,
  MaintenanceStatus,
  VehicleUsageType,
  FuelType,
} from '@backend/domain/carbon';

describe('Scope 1 calculators (thermal, cold, vehicles)', () => {
  describe('Thermal Scope 1 (CO2_th)', () => {
    const baseThermalInput: Omit<
      ThermalScope1Input,
      'hasHeatUsages' | 'selectedHeatUsages' | 'selectedHeatEnergies'
    > = {
      annualElectricityKwh: 5530.71,
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
    };

    it('returns zeros when no heat usages are present (Étape 0)', () => {
      const result = calculateThermalScope1({
        ...baseThermalInput,
        hasHeatUsages: false,
        selectedHeatUsages: [],
        selectedHeatEnergies: [],
      });

      expect(result.baseThermalKwh).toBe(0);
      expect(result.finalThermalKwh).toBe(0);
      expect(result.co2ThermalKg).toBe(0);
      expect(result.co2ThermalTonnes).toBe(0);
    });

    it('computes thermal emissions for office with ECS + chauffage, natural gas only', () => {
      const selectedHeatUsages: HeatUsageKey[] = [
        'DOMESTIC_HOT_WATER',
        'SPACE_HEATING',
      ];
      const selectedHeatEnergies: HeatEnergyType[] = ['NATURAL_GAS'];

      const result = calculateThermalScope1({
        ...baseThermalInput,
        hasHeatUsages: true,
        selectedHeatUsages,
        selectedHeatEnergies,
      });

      expect(result.baseThermalKwh).toBeCloseTo(829.61, 2);
      expect(result.usagesCoefficient).toBeCloseTo(1.15, 2);
      expect(result.finalThermalKwh).toBeCloseTo(954.05, 2);
      expect(result.appliedThermalEmissionFactor).toBeCloseTo(0.185, 3);
      expect(result.co2ThermalKg).toBeCloseTo(176.5, 2);
      expect(result.co2ThermalTonnes).toBeCloseTo(0.176, 3);
    });
  });

  describe('Cold Scope 1 (CO2_froid)', () => {
    const baseColdInput: Omit<
      ColdScope1Input,
      'hasCold' | 'surfaceM2'
    > = {
      buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
      intensityLevel: IntensityLevel.MODERATE,
      equipmentAge: EquipmentAge.BETWEEN_3_AND_7_YEARS,
      maintenanceStatus: MaintenanceStatus.NOT_SPECIFIED,
    };

    it('returns zeros when no cold is present (D0)', () => {
      const result = calculateColdScope1({
        ...baseColdInput,
        hasCold: false,
        surfaceM2: 500,
      });

      expect(result.coldType).toBeNull();
      expect(result.numberOfUnits).toBe(0);
      expect(result.totalChargeKg).toBe(0);
      expect(result.annualLeakKg).toBe(0);
      expect(result.co2ColdKg).toBe(0);
      expect(result.co2ColdTonnes).toBe(0);
    });

    it('computes cold emissions for an office with comfort cooling', () => {
      const result = calculateColdScope1({
        ...baseColdInput,
        hasCold: true,
        surfaceM2: 700,
      });

      expect(result.coldType).toBe(ColdType.COMFORT);
      expect(result.numberOfUnits).toBe(20);
      expect(result.totalChargeKg).toBeCloseTo(40, 2);
      expect(result.annualLeakKg).toBeGreaterThan(0);
      expect(result.co2ColdKg).toBeGreaterThan(0);
      expect(result.co2ColdTonnes).toBeGreaterThan(0);
    });
  });

  describe('Vehicles Scope 1 (CO2_veh)', () => {
    const baseVehiclesInput: Omit<
      VehiclesScope1Input,
      'hasVehicles' | 'numberOfVehicles' | 'kmPerVehiclePerYear'
    > = {
      usageType: VehicleUsageType.LIGHT_TRAVEL,
      fuelType: FuelType.DIESEL,
    };

    it('returns zeros when there are no vehicles (E0)', () => {
      const result = calculateVehiclesScope1({
        ...baseVehiclesInput,
        hasVehicles: false,
        numberOfVehicles: 0,
        kmPerVehiclePerYear: 0,
      });

      expect(result.totalAnnualKm).toBe(0);
      expect(result.annualFuelLiters).toBe(0);
      expect(result.co2VehiclesKg).toBe(0);
      expect(result.co2VehiclesTonnes).toBe(0);
    });

    it('computes CO2_veh for a small diesel fleet', () => {
      const result = calculateVehiclesScope1({
        ...baseVehiclesInput,
        hasVehicles: true,
        numberOfVehicles: 5,
        kmPerVehiclePerYear: 20000,
      });

      expect(result.totalAnnualKm).toBeCloseTo(100000, 2);
      expect(result.annualFuelLiters).toBeCloseTo(7500, 1);
      expect(result.co2VehiclesKg).toBeCloseTo(18750, 0);
      expect(result.co2VehiclesTonnes).toBeCloseTo(18.75, 2);
    });
  });
});

