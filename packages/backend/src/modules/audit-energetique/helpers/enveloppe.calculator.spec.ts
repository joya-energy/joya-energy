import {
    InsulationQualities,
    GlazingTypes,
    VentilationSystems
  } from '@shared/enums/audit-batiment.enum';
  import { computeEnvelopeFactor, computeCompactnessFactor } from '../../../modules/audit-energetique/helpers/envelope.calculator';
  
  describe('computeEnvelopeFactor', () => {
    it('multiplies insulation, glazing and ventilation factors', () => {
      const result = computeEnvelopeFactor(
        InsulationQualities.MEDIUM,
        GlazingTypes.DOUBLE,
        VentilationSystems.DOUBLE_FLOW
      );
  
      expect(result).toBeCloseTo(0.95);
    });
  
    it('returns higher penalty for poor envelope performance', () => {
      const result = computeEnvelopeFactor(
        InsulationQualities.LOW,
        GlazingTypes.SINGLE,
        VentilationSystems.SINGLE_FLOW
      );
  
      expect(result).toBeCloseTo(1.386);
    });
  });
  
  describe('computeCompactnessFactor', () => {
    it('returns single-floor factor for ground-only buildings', () => {
      expect(computeCompactnessFactor(1)).toBe(1);
    });
  
    it('returns intermediate factor for two or three floors', () => {
      expect(computeCompactnessFactor(3)).toBe(0.95);
    });
  
    it('returns best compactness for tall buildings', () => {
      expect(computeCompactnessFactor(5)).toBe(0.9);
    });
  });
  
  