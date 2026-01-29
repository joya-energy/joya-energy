import { calculateTravelScope3 } from './travel-scope3.calculator';
import { calculateITEquipmentScope3 } from './it-equipment-scope3.calculator';
import { calculateScope3, type Scope3Input } from './scope3.calculator';
import { TravelFrequency } from '@backend/domain/carbon';

describe('Scope 3 calculators (travel, IT equipment, total)', () => {
  describe('Travel Scope 3 (CO2_travel)', () => {
    it('returns zeros when no plane or train frequency is provided', () => {
      const result = calculateTravelScope3({});

      expect(result.co2PlaneKg).toBe(0);
      expect(result.co2TrainKg).toBe(0);
      expect(result.co2TravelKg).toBe(0);
      expect(result.co2TravelTonnes).toBe(0);
    });

    it('computes CO2_travel = CO2_avion + CO2_train for plane RARE + train MEDIUM', () => {
      const result = calculateTravelScope3({
        planeFrequency: TravelFrequency.RARE,
        trainFrequency: TravelFrequency.MEDIUM,
      });

      // Plane RARE = 600, Train MEDIUM = 240
      expect(result.co2PlaneKg).toBe(600);
      expect(result.co2TrainKg).toBe(240);
      expect(result.co2TravelKg).toBe(840);
      expect(result.co2TravelTonnes).toBe(0.84);
    });
  });

  describe('IT Equipment Scope 3 (CO2_IT)', () => {
    it('returns zeros when all counts are zero', () => {
      const result = calculateITEquipmentScope3({
        laptopCount: 0,
        desktopCount: 0,
        screenCount: 0,
        proPhoneCount: 0,
      });

      expect(result.co2ITKg).toBe(0);
      expect(result.co2ITTonnes).toBe(0);
    });

    it('computes CO2_IT = 120×Laptop + 200×Desktop + 80×Screen + 50×Pro phone', () => {
      const result = calculateITEquipmentScope3({
        laptopCount: 2,
        desktopCount: 1,
        screenCount: 2,
        proPhoneCount: 3,
      });

      // 2×120 + 1×200 + 2×80 + 3×50 = 240 + 200 + 160 + 150 = 750
      expect(result.co2ITKg).toBe(750);
      expect(result.co2ITTonnes).toBe(0.75);
    });
  });

  describe('Total Scope 3 (CO2_Scope3)', () => {
    it('computes CO2_Scope3 = CO2_travel + CO2_IT and tCO2_Scope3', () => {
      const input: Scope3Input = {
        travel: {
          planeFrequency: TravelFrequency.RARE,
          trainFrequency: TravelFrequency.MEDIUM,
        },
        itEquipment: {
          laptopCount: 2,
          desktopCount: 1,
          screenCount: 2,
          proPhoneCount: 3,
        },
      };

      const result = calculateScope3(input);

      expect(result.co2TravelKg).toBe(840);
      expect(result.co2TravelTonnes).toBe(0.84);
      expect(result.co2ITKg).toBe(750);
      expect(result.co2ITTonnes).toBe(0.75);
      expect(result.co2Scope3Kg).toBe(1590);
      expect(result.co2Scope3Tonnes).toBe(1.59);
    });
  });
});
