import { computeProgressiveTariff } from './progressive-tariff.calculator';

describe('Progressive Tariff Calculator', () => {
  describe('computeProgressiveTariff', () => {
    it('should return zero cost for zero consumption', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 0
      });

      expect(result.monthlyCost).toBe(0);
      expect(result.annualCost).toBe(0);
      expect(result.effectiveRate).toBe(0);
      expect(result.bracketDetails).toHaveLength(0);
    });

    it('should calculate cost for consumption in first bracket only (150 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 150
      });

      // 150 kWh × 0.195 = 29.25 DT
      expect(result.monthlyCost).toBe(29.25);
      expect(result.annualCost).toBe(351);
      expect(result.effectiveRate).toBe(0.195);
      expect(result.bracketDetails).toHaveLength(1);
      expect(result.bracketDetails[0]).toEqual({
        min: 0,
        max: 200,
        rate: 0.195,
        consumption: 150,
        cost: 29.25
      });
    });

    it('should calculate cost exactly at first bracket boundary (200 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 200
      });

      // 200 kWh × 0.195 = 39.00 DT
      expect(result.monthlyCost).toBe(39);
      expect(result.annualCost).toBe(468);
      expect(result.effectiveRate).toBe(0.195);
      expect(result.bracketDetails).toHaveLength(1);
    });

    it('should calculate cost across two brackets (250 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 250
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 50 kWh × 0.240 = 12.00 DT
      // Total = 51.00 DT
      expect(result.monthlyCost).toBe(51);
      expect(result.annualCost).toBe(612);
      expect(result.effectiveRate).toBe(0.204); // 51 / 250
      expect(result.bracketDetails).toHaveLength(2);
      
      expect(result.bracketDetails[0]).toEqual({
        min: 0,
        max: 200,
        rate: 0.195,
        consumption: 200,
        cost: 39
      });
      
      expect(result.bracketDetails[1]).toEqual({
        min: 200,
        max: 300,
        rate: 0.240,
        consumption: 50,
        cost: 12
      });
    });

    it('should calculate cost exactly at second bracket boundary (300 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 300
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 100 kWh × 0.240 = 24.00 DT
      // Total = 63.00 DT
      expect(result.monthlyCost).toBe(63);
      expect(result.annualCost).toBe(756);
      expect(result.effectiveRate).toBe(0.21); // 63 / 300
      expect(result.bracketDetails).toHaveLength(2);
    });

    it('should calculate cost across three brackets (400 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 400
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 100 kWh × 0.240 = 24.00 DT
      // Next 100 kWh × 0.333 = 33.30 DT
      // Total = 96.30 DT
      expect(result.monthlyCost).toBe(96.3);
      expect(result.annualCost).toBe(1155.6);
      expect(result.effectiveRate).toBeCloseTo(0.2408, 4); // 96.3 / 400
      expect(result.bracketDetails).toHaveLength(3);
      
      expect(result.bracketDetails[2]).toEqual({
        min: 300,
        max: 500,
        rate: 0.333,
        consumption: 100,
        cost: 33.3
      });
    });

    it('should calculate cost exactly at third bracket boundary (500 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 500
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 100 kWh × 0.240 = 24.00 DT
      // Next 200 kWh × 0.333 = 66.60 DT
      // Total = 129.60 DT
      expect(result.monthlyCost).toBe(129.6);
      expect(result.annualCost).toBe(1555.2);
      expect(result.effectiveRate).toBeCloseTo(0.2592, 4);
      expect(result.bracketDetails).toHaveLength(3);
    });

    it('should calculate cost in highest bracket (600 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 600
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 100 kWh × 0.240 = 24.00 DT
      // Next 200 kWh × 0.333 = 66.60 DT
      // Next 100 kWh × 0.391 = 39.10 DT
      // Total = 168.70 DT
      expect(result.monthlyCost).toBe(168.7);
      expect(result.annualCost).toBe(2024.4);
      expect(result.effectiveRate).toBeCloseTo(0.2812, 4);
      expect(result.bracketDetails).toHaveLength(4);
      
      expect(result.bracketDetails[3]).toEqual({
        min: 500,
        max: Number.POSITIVE_INFINITY,
        rate: 0.391,
        consumption: 100,
        cost: 39.1
      });
    });

    it('should calculate cost for very high consumption (1000 kWh)', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 1000
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 100 kWh × 0.240 = 24.00 DT
      // Next 200 kWh × 0.333 = 66.60 DT
      // Next 500 kWh × 0.391 = 195.50 DT
      // Total = 325.10 DT
      expect(result.monthlyCost).toBe(325.1);
      expect(result.annualCost).toBe(3901.2);
      expect(result.effectiveRate).toBeCloseTo(0.3251, 4);
      expect(result.bracketDetails).toHaveLength(4);
    });

    it('should handle decimal consumption values correctly', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 225.5
      });

      // First 200 kWh × 0.195 = 39.00 DT
      // Next 25.5 kWh × 0.240 = 6.12 DT
      // Total = 45.12 DT
      expect(result.monthlyCost).toBe(45.12);
      expect(result.annualCost).toBe(541.44);
      expect(result.bracketDetails).toHaveLength(2);
      expect(result.bracketDetails[1].consumption).toBe(25.5);
    });

    it('should verify all bracket details sum to total consumption', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 750
      });

      const totalConsumptionFromBrackets = result.bracketDetails.reduce(
        (sum, bracket) => sum + bracket.consumption,
        0
      );
      expect(totalConsumptionFromBrackets).toBe(750);

      const totalCostFromBrackets = result.bracketDetails.reduce(
        (sum, bracket) => sum + bracket.cost,
        0
      );
      expect(totalCostFromBrackets).toBeCloseTo(result.monthlyCost, 2);
    });

    it('should verify effective rate is always between lowest and highest bracket rates', () => {
      const testCases = [150, 250, 400, 600, 1000];
      
      testCases.forEach(consumption => {
        const result = computeProgressiveTariff({
          monthlyConsumption: consumption
        });
        
        expect(result.effectiveRate).toBeGreaterThanOrEqual(0.195);
        expect(result.effectiveRate).toBeLessThanOrEqual(0.391);
      });
    });

    it('should verify annual cost is exactly 12 times monthly cost', () => {
      const result = computeProgressiveTariff({
        monthlyConsumption: 350
      });

      expect(result.annualCost).toBe(Number((result.monthlyCost * 12).toFixed(2)));
    });

    it('should demonstrate progressive nature of tariff', () => {
      const result1 = computeProgressiveTariff({ monthlyConsumption: 100 });
      const result2 = computeProgressiveTariff({ monthlyConsumption: 400 });

      // Effective rate should increase as consumption increases (progressive tariff)
      expect(result2.effectiveRate).toBeGreaterThan(result1.effectiveRate);
    });
  });
});

