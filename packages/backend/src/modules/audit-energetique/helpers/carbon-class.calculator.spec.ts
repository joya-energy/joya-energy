import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade, EmissionUnit } from '@shared/enums/classification.enum';
import { computeCarbonClass } from './carbon-class.calculator';

describe('Carbon Class Calculator', () => {
  describe('computeCarbonClass', () => {
    it('should classify pharmacies correctly', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.PHARMACY,
        totalCo2Kg: 5000,
        conditionedSurface: 100
      });

      expect(result.isApplicable).toBe(true);
      expect(result.carbonClass).toBe(ClassificationGrade.D); // 50 kg CO₂/m².an falls in D range (40-60)
      expect(result.intensity).toBe(50);
      expect(result.unit).toBe(EmissionUnit.KG_CO2_PER_M2_YEAR);
    });

    it('should return NOT_APPLICABLE for invalid conditioned surface', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 5000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.carbonClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.intensity).toBeNull();
      expect(result.unit).toBe(EmissionUnit.KG_CO2_PER_M2_YEAR);
      expect(result.classDescription).toBe('Surface conditionnée invalide');
    });

    it('should classify offices with class A for very low emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 1000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(10);
      expect(result.unit).toBe(EmissionUnit.KG_CO2_PER_M2_YEAR);
      expect(result.carbonClass).toBe(ClassificationGrade.A);
      expect(result.classDescription).toBe('Très faible empreinte carbone');
      expect(result.isApplicable).toBe(true);
    });

    it('should classify offices with class B for low emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 2000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(20);
      expect(result.carbonClass).toBe(ClassificationGrade.B);
      expect(result.classDescription).toBe('Bonne performance');
      expect(result.isApplicable).toBe(true);
    });

    it('should classify offices with class C for average emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 3000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(30);
      expect(result.carbonClass).toBe(ClassificationGrade.C);
      expect(result.classDescription).toBe('Niveau moyen');
      expect(result.isApplicable).toBe(true);
    });

    it('should classify offices with class D for high emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 5000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(50);
      expect(result.carbonClass).toBe(ClassificationGrade.D);
      expect(result.classDescription).toBe('Émissions élevées');
      expect(result.isApplicable).toBe(true);
    });

    it('should classify offices with class E for very high emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 7000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(70);
      expect(result.carbonClass).toBe(ClassificationGrade.E);
      expect(result.classDescription).toBe('Très émissif');
      expect(result.isApplicable).toBe(true);
    });

    it('should classify cafes/restaurants correctly', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.CAFE_RESTAURANT,
        totalCo2Kg: 3500,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(35);
      expect(result.carbonClass).toBe(ClassificationGrade.C);
      expect(result.isApplicable).toBe(true);
    });

    it('should classify hotels correctly', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.HOTEL_GUESTHOUSE,
        totalCo2Kg: 4000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(40);
      expect(result.carbonClass).toBe(ClassificationGrade.C);
      expect(result.isApplicable).toBe(true);
    });

    it('should classify clinics correctly', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        totalCo2Kg: 5500,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(55);
      expect(result.carbonClass).toBe(ClassificationGrade.C);
      expect(result.isApplicable).toBe(true);
    });

    it('should classify schools correctly', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.SCHOOL_TRAINING,
        totalCo2Kg: 2500,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(25);
      expect(result.carbonClass).toBe(ClassificationGrade.C);
      expect(result.isApplicable).toBe(true);
    });

    it('should handle edge case at threshold boundary', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 1500,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(15);
      expect(result.carbonClass).toBe(ClassificationGrade.A); // 15 <= 15 (threshold for A)
      expect(result.isApplicable).toBe(true);
    });

    it('should handle very large emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 100000,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(1000);
      expect(result.carbonClass).toBe(ClassificationGrade.E);
      expect(result.isApplicable).toBe(true);
    });

    it('should handle very small emissions', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 100,
        conditionedSurface: 100
      });

      expect(result.intensity).toBe(1);
      expect(result.carbonClass).toBe(ClassificationGrade.A);
      expect(result.isApplicable).toBe(true);
    });

    it('should round intensity to 2 decimal places', () => {
      const result = computeCarbonClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        totalCo2Kg: 1234.5678,
        conditionedSurface: 123.456
      });

      expect(result.intensity).toBe(10);
      expect(result.isApplicable).toBe(true);
    });
  });
});

