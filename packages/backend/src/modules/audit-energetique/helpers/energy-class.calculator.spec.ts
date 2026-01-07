import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE when conditioned surface is invalid', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('maps low-intensity offices to class A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('maps moderate offices to class B', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('maps clinics with high intensity to class E', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE when conditioned surface invalid', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('classifies a low-intensity office as A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('classifies a standard office as B', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('classifies clinics as E when intensity high', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE when conditioned surface is invalid', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('classifies a low-intensity office as A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('classifies a standard office as B', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('classifies clinics as E when intensity is high', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE when conditioned surface is invalid', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('classifies a low-intensity office as A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('classifies a standard office as B', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('classifies clinics as E when intensity is high', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE when conditioned surface is invalid', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('classifies a low-intensity office as A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('classifies a standard office as B', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('classifies clinics as E when intensity is high', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE when conditioned surface is invalid', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('classifies a low-intensity office as A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('classifies a standard office as B', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('classifies clinics as E when intensity is high', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { ClassificationGrade } from '@shared/enums/classification.enum';
import { computeEnergyClass } from './energy-class.calculator';

describe('Energy Class Calculator', () => {
  describe('computeEnergyClass', () => {
    it('returns NOT_APPLICABLE for invalid conditioned surface', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 1000,
        gasConsumption: 1000,
        conditionedSurface: 0
      });

      expect(result.isApplicable).toBe(false);
      expect(result.joyaClass).toBe(ClassificationGrade.NOT_APPLICABLE);
      expect(result.classDescription).toContain('Surface conditionnée invalide');
    });

    it('classifies low-intensity office as A', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 4000,
        gasConsumption: 500,
        conditionedSurface: 100
      });

      expect(result.referenceIntensity).toBe(110);
      expect(result.joyaClass).toBe(ClassificationGrade.A);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.6);
    });

    it('sets B for a moderate-intensity office', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.OFFICE_ADMIN_BANK,
        electricityConsumption: 9000,
        gasConsumption: 2000,
        conditionedSurface: 100
      });

      expect(result.joyaClass).toBe(ClassificationGrade.B);
      expect(result.joyaIndex).toBeGreaterThan(0.6);
      expect(result.joyaIndex).toBeLessThanOrEqual(0.85);
    });

    it('classifies clinics as E when intensity is high', () => {
      const result = computeEnergyClass({
        buildingType: BuildingTypes.CLINIC_MEDICAL,
        electricityConsumption: 40000,
        gasConsumption: 12000,
        conditionedSurface: 100,
        gasEfficiency: 0.85
      });

      expect(result.referenceIntensity).toBe(220);
      expect(result.joyaIndex).toBeGreaterThan(1.4);
      expect(result.joyaClass).toBe(ClassificationGrade.E);
    });
  });
});

