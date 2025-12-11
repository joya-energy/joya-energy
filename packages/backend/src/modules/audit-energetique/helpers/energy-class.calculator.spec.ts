import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('should classify as NOT_APPLICABLE for buildings without energy thresholds', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.PHARMACY,
        heatingLoad: 1000,
        coolingLoad: 500,
        conditionedSurface: 100
      });

      expect(result.isApplicable).toBe(false);
      expect(result.becth).toBe(15); // BECTh still calculated: (1000 + 500) / 100 = 15
      expect(result.energyClass).toBe(ClassificationGrade.NOT_APPLICABLE);
    });

    it('should return NOT_APPLICABLE for invalid conditioned surface', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        heatingLoad: 1000,
        coolingLoad: 500,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.energyClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toBe('Surface conditionnée invalide');
    });

    it('should compute BECTh and class A for very efficient offices', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        heatingLoad: 3000,
        coolingLoad: 2000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(50);
      expect(result.energyClass).toBe(ClassificationGrade.A);
      expect(result.classDescription).toContain('Très bon niveau énergétique');
      expect(result.isApplicable).toBe(true);
    });

    it('should compute BECTh and class B for good offices', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        heatingLoad: 5000,
        coolingLoad: 3000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(80);
      expect(result.energyClass).toBe(ClassificationGrade.B);
      expect(result.classDescription).toContain('Bon confort et bonne enveloppe');
      expect(result.isApplicable).toBe(true);
    });

    it('should compute BECTh and class C for average offices in Tunisia', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        heatingLoad: 7000,
        coolingLoad: 5000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(120);
      expect(result.energyClass).toBe(ClassificationGrade.C);
      expect(result.classDescription).toContain('Niveau courant en Tunisie');
      expect(result.isApplicable).toBe(true);
    });

    it('should classify cafes/restaurants correctly', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CAFE_RESTAURANT,
        heatingLoad: 6000,
        coolingLoad: 4000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(100);
      expect(result.energyClass).toBe(ClassificationGrade.B);
      expect(result.isApplicable).toBe(true);
    });

    it('should classify hotels correctly', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.HOTEL_GUESTHOUSE,
        heatingLoad: 8000,
        coolingLoad: 4000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(120);
      expect(result.energyClass).toBe(ClassificationGrade.B);
      expect(result.isApplicable).toBe(true);
    });

    it('should classify clinics correctly', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        heatingLoad: 10000,
        coolingLoad: 8000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(180);
      expect(result.energyClass).toBe(ClassificationGrade.C);
      expect(result.isApplicable).toBe(true);
    });

    it('should classify schools correctly', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.SCHOOL_TRAINING,
        heatingLoad: 5000,
        coolingLoad: 3000,
        conditionedSurface: 100
      });

      expect(result.becth).toBe(80);
      expect(result.energyClass).toBe(ClassificationGrade.B);
      expect(result.isApplicable).toBe(true);
    });
  });
});

