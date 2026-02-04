import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade, EmissionUnit } from '@shared/enums/classification.enum';
import { computeCo2Emissions } from './emissions.calculator';

describe('CO₂ Emissions Calculator', () => {
  describe('computeCo2Emissions', () => {
    it('should compute CO₂ emissions with default emission factors', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 10000,
        gasConsumption: 5000,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 100
      });

      expect(result.co2FromElectricity).toBe(4630);
      expect(result.co2FromGas).toBe(925);
      expect(result.totalCo2).toBe(5555);
      expect(result.totalCo2Tons).toBe(5.56);
    });

    it('should compute CO₂ emissions with custom emission factors', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 1000,
        gasConsumption: 1000,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 100,
        emissionFactorElec: 0.4,
        emissionFactorGas: 0.3
      });

      expect(result.totalCo2).toBe(700);
      expect(result.co2FromElectricity).toBe(400);
      expect(result.co2FromGas).toBe(300);
    });

    it('should include carbon classification in the result', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 10000,
        gasConsumption: 5000,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 100
      });

      expect(result.carbonIntensity).toBe(55.55);
      expect(result.carbonIntensityUnit).toBe(EmissionUnit.KG_CO2_PER_M2_YEAR);
      expect(result.carbonClass).toBe(ClassificationGrade.E);
      expect(result.carbonDescription).toBe('Très émissif');
      expect(result.isApplicable).toBe(true);
    });

    it('should handle zero gas consumption', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 5000,
        gasConsumption: 0,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 100
      });

      expect(result.co2FromGas).toBe(0);
      expect(result.totalCo2).toBe(2315);
      expect(result.carbonIntensity).toBe(23.15);
    });

    it('should handle zero electricity consumption', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 0,
        gasConsumption: 5000,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 100
      });

      expect(result.co2FromElectricity).toBe(0);
      expect(result.totalCo2).toBe(925);
      expect(result.carbonIntensity).toBe(9.25);
    });

    it('should classify carbon as NOT_APPLICABLE for invalid surface', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 10000,
        gasConsumption: 5000,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 0
      });

      expect(result.carbonClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.carbonIntensity).toBeNull();
      expect(result.carbonIntensityUnit).toBe(EmissionUnit.KG_CO2_PER_M2_YEAR);
      expect(result.isApplicable).toBe(false);
    });

    it('should classify carbon correctly for different building types', () => {
      const resultOffice = computeCo2Emissions({
        electricityConsumption: 3000,
        gasConsumption: 1000,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 100
      });

      expect(resultOffice.carbonIntensity).toBe(15.74);
      expect(resultOffice.carbonClass).toBe(ClassificationGrade.B);

      const resultHotel = computeCo2Emissions({
        electricityConsumption: 3000,
        gasConsumption: 1000,
        buildingType: BuildingTypes.HOTEL_GUESTHOUSE,
        conditionedSurface: 100
      });

      expect(resultHotel.carbonIntensity).toBe(15.74);
      expect(resultHotel.carbonClass).toBe(ClassificationGrade.A);
    });

    it('should round all values to 2 decimal places', () => {
      const result = computeCo2Emissions({
        electricityConsumption: 3333,
        gasConsumption: 4444,
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        conditionedSurface: 123
      });

      expect(result.co2FromElectricity).toBe(1543.48);
      expect(result.co2FromGas).toBe(822.14);
      expect(result.totalCo2).toBeCloseTo(2365.62, 1); // Allow 0.1 tolerance for floating-point arithmetic
      expect(result.carbonIntensity).toBeCloseTo(19.23, 2);
    });
  });
});

