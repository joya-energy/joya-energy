# Classification System Documentation

## Overview

The JOYA energy audit system provides two distinct classification systems:

1. **Energy Classification (Classement Énergétique)** - Based on thermal comfort energy needs (BECTh)
2. **Carbon Classification (Classement Carbone)** - Based on CO₂ emissions intensity

Both use a unified grading system: **A (best) → E (worst)** plus **N/A** for non-applicable cases.

---

## Unified Enums

### Classification Grades

```typescript
// @shared/enums/classification.enum.ts
export enum ClassificationGrade {
  A = 'A',           // Excellent
  B = 'B',           // Good
  C = 'C',           // Average
  D = 'D',           // Below average
  E = 'E',           // Poor
  NOT_APPLICABLE = 'N/A'
}
```

### Energy Units

```typescript
export enum EnergyUnit {
  KWH_PER_M2_YEAR = 'kWh/m².an',
  KWH_PER_YEAR = 'kWh/an',
  KWH_PER_MONTH = 'kWh/mois',
  TND_PER_YEAR = 'TND/an',
  TND_PER_MONTH = 'TND/mois'
}
```

### Emission Units

```typescript
export enum EmissionUnit {
  KG_CO2_PER_YEAR = 'kg CO₂/an',
  TONS_CO2_PER_YEAR = 't CO₂/an',
  KG_CO2_PER_M2_YEAR = 'kg CO₂/m².an'
}
```

---

## 1. Energy Classification (BECTh)

### Formula

```
BECTh = (BECh + BERef) / STC
```

Where:
- **BECh**: Annual heating needs (kWh/year)
- **BERef**: Annual cooling needs (kWh/year)
- **STC**: Total conditioned surface (m²)
- **BECTh**: Thermal comfort energy needs (kWh/m².year)

### Applicable Building Types

Energy classification is available for the following building types:

- Bureaux / Administration / Banque
- Café / Restaurant
- Hôtel
- Clinique / Hôpital
- École / Formation

### Thresholds by Building Type

#### Bureaux / Administration / Banque

| BECTh Range | Class | Description |
|-------------|-------|-------------|
| < 60 | A | Très bon niveau énergétique (bâtiment récent / clim performante) |
| 60 - 90 | B | Bon confort et bonne enveloppe |
| 90 - 120 | C | Niveau courant en Tunisie |
| 120 - 160 | D | Isolation faible, clim ancienne |
| ≥ 160 | E | Bâtiment énergivore |

#### Café / Restaurant

| BECTh Range | Class | Description |
|-------------|-------|-------------|
| < 80 | A | Rare, clim performante et bien dimensionnée |
| 80 - 120 | B | Niveau correct |
| 120 - 160 | C | Fréquent en Tunisie |
| 160 - 220 | D | Climatisation vieillissante |
| ≥ 220 | E | Très énergivore |

#### Hôtel

| BECTh Range | Class | Description |
|-------------|-------|-------------|
| < 90 | A | Excellent niveau pour hôtel |
| 90 - 130 | B | Bon niveau de confort |
| 130 - 180 | C | Standard tunisien |
| 180 - 250 | D | Amélioration nécessaire |
| ≥ 250 | E | Performance faible |

#### Clinique / Hôpital

| BECTh Range | Class | Description |
|-------------|-------|-------------|
| < 120 | A | Excellent niveau pour clinique |
| 120 - 180 | B | Bon niveau de confort |
| 180 - 240 | C | Standard tunisien |
| 240 - 320 | D | Amélioration nécessaire |
| ≥ 320 | E | Performance faible |

#### École / Formation

| BECTh Range | Class | Description |
|-------------|-------|-------------|
| < 50 | A | Excellent niveau pour école |
| 50 - 80 | B | Bon niveau de confort |
| 80 - 110 | C | Standard tunisien |
| 110 - 150 | D | Amélioration nécessaire |
| ≥ 150 | E | Performance faible |

### Implementation

```typescript
// packages/backend/src/modules/audit-energetique/helpers/energy-class.calculator.ts

export interface EnergyClassResult {
  becth: number | null;
  unit: EnergyUnit.KWH_PER_M2_YEAR;
  energyClass: ClassificationGrade | null;
  classDescription: string | null;
  isApplicable: boolean;
}

export function computeEnergyClass(input: EnergyClassInput): EnergyClassResult
```

---

## 2. Carbon Classification (CO₂)

### Formula

```
CI = CO₂_total / Surface

CO₂_total = (E_elec × 0.512) + (E_gaz × 0.202)
```

Where:
- **E_elec**: Electricity consumption (kWh/year)
- **E_gaz**: Gas consumption (kWh/year)
- **0.512**: Emission factor for STEG electricity (kg CO₂/kWh)
- **0.202**: Emission factor for natural gas (kg CO₂/kWh)
- **CI**: Carbon intensity (kg CO₂/m².an)

### Applicable Building Types

Carbon classification is available for ALL building types, with specific thresholds for:

- Bureaux / Administration / Banque
- Pharmacie
- Café / Restaurant
- Centre de beauté
- Hôtel
- Clinique / Médical
- École / Formation

### Thresholds by Building Type

#### Bureaux / Pharmacie (General Thresholds)

| CI Range | Class | Description |
|----------|-------|-------------|
| < 15 | A | Très faible empreinte carbone |
| 15 - 25 | B | Bonne performance |
| 25 - 40 | C | Niveau moyen |
| 40 - 60 | D | Émissions élevées |
| ≥ 60 | E | Très émissif |

#### Café / Restaurant / Centre de beauté

| CI Range | Class | Description |
|----------|-------|-------------|
| < 20 | A | Très faible empreinte carbone |
| 20 - 30 | B | Bonne performance |
| 30 - 50 | C | Niveau moyen |
| 50 - 75 | D | Émissions élevées |
| ≥ 75 | E | Très émissif |

#### Hôtel

| CI Range | Class | Description |
|----------|-------|-------------|
| < 18 | A | Très faible empreinte carbone |
| 18 - 30 | B | Bonne performance |
| 30 - 50 | C | Niveau moyen |
| 50 - 70 | D | Émissions élevées |
| ≥ 70 | E | Très émissif |

#### Clinique / Médical

| CI Range | Class | Description |
|----------|-------|-------------|
| < 20 | A | Très faible empreinte carbone |
| 20 - 35 | B | Bonne performance |
| 35 - 55 | C | Niveau moyen |
| 55 - 80 | D | Émissions élevées |
| ≥ 80 | E | Très émissif |

#### École / Formation

| CI Range | Class | Description |
|----------|-------|-------------|
| < 12 | A | Très faible empreinte carbone |
| 12 - 20 | B | Bonne performance |
| 20 - 30 | C | Niveau moyen |
| 30 - 45 | D | Émissions élevées |
| ≥ 45 | E | Très émissif |

### Implementation

```typescript
// packages/backend/src/modules/audit-energetique/helpers/carbon-class.calculator.ts

export interface CarbonClassResult {
  intensity: number | null;
  unit: EmissionUnit.KG_CO2_PER_M2_YEAR;
  carbonClass: ClassificationGrade | null;
  classDescription: string | null;
  isApplicable: boolean;
}

export function computeCarbonClass(input: CarbonClassInput): CarbonClassResult
```

---

## Integration Flow

### 1. Service Layer

```typescript
// audit-energetique.service.ts

// Calculate emissions with integrated carbon classification
const emissions = computeCo2Emissions({
  electricityConsumption: energySplit.electricityConsumption,
  gasConsumption: energySplit.gasConsumption,
  buildingType: payload.buildingType,
  conditionedSurface,
  emissionFactorElec: EMISSION_FACTORS.ELECTRICITY,
  emissionFactorGas: EMISSION_FACTORS.NATURAL_GAS
});

// Calculate energy class separately
const energyClassResult = computeEnergyClass({
  buildingType: payload.buildingType,
  heatingLoad: annualHeatingLoadKwh,
  coolingLoad: annualCoolingLoadKwh,
  conditionedSurface
});

// Store all classification results
const simulationPayload: ICreateAuditEnergetiqueSimulation = {
  ...payload,
  // Energy results
  annualConsumption: Number(annualConsumption.toFixed(2)),
  monthlyConsumption: Number(monthlyConsumption.toFixed(2)),
  energyCostPerYear: Number((annualConsumption * energyCostPerKwh).toFixed(2)),
  
  // CO₂ results
  co2EmissionsKg: emissions.totalCo2,
  co2EmissionsTons: emissions.totalCo2Tons,
  co2EmissionsElecKg: emissions.co2FromElectricity,
  co2EmissionsGasKg: emissions.co2FromGas,
  
  // Carbon classification
  carbonClass: emissions.carbonClass ?? undefined,
  carbonClassDescription: emissions.carbonDescription ?? undefined,
  carbonIntensity: emissions.carbonIntensity ?? undefined,
  
  // Energy classification
  energyClass: energyClassResult.energyClass ?? undefined,
  energyClassDescription: energyClassResult.classDescription ?? undefined,
  becth: energyClassResult.becth ?? undefined
};
```

### 2. Response DTO

```typescript
// audit-energetique-response.dto.ts

export interface AuditEnergetiqueResponseDto {
  success: boolean;
  data: {
    simulationId: string;
    // ... contact, building, envelope, systems, billing
    results: {
      energyConsumption: EnergyConsumption;
      co2Emissions: CO2Emissions;
      energyCost: EnergyCost;
      energyClassification?: EnergyClassification;
      carbonClassification?: CarbonClassification;
    };
  };
  metadata: {
    version: string;
    calculationDate: string;
  };
}
```

---

## Testing

### Coverage

All calculators have comprehensive test suites:

- ✅ `energy-class.calculator.spec.ts` - 9 test cases
- ✅ `carbon-class.calculator.spec.ts` - 14 test cases
- ✅ `emission.calculator.spec.ts` - 10 test cases

### Test Cases Include

- Valid classifications for all building types
- Edge cases (boundary values)
- Invalid inputs (zero/negative surface)
- Precision (rounding to 2 decimal places)
- Unit validation

---

## Code Quality Standards

### Clean Code Principles Applied

✅ **Single Responsibility**: Each calculator has one clear purpose
✅ **Pure Functions**: No side effects, deterministic output
✅ **Strong Typing**: No `any` or `unknown`, explicit interfaces
✅ **Descriptive Names**: Clear function and variable names
✅ **Small Functions**: ~20 lines max per function
✅ **No Magic Values**: Constants for emission factors and thresholds
✅ **DRY**: Shared enums, no duplication
✅ **Proper Error Handling**: Explicit handling of invalid inputs

### Architecture Compliance

✅ **Clean Architecture**: Helpers in proper layer, no business logic leakage
✅ **Import Ordering**: External → internal → relative
✅ **Separation of Concerns**: Calculation logic separate from persistence
✅ **Dependency Inversion**: Service depends on helpers, not vice versa

---

## API Response Example

```json
{
  "success": true,
  "data": {
    "simulationId": "abc-123",
    "results": {
      "energyClassification": {
        "becth": 85.5,
        "unit": "kWh/m².an",
        "class": "B",
        "description": "Bon confort et bonne enveloppe",
        "isApplicable": true
      },
      "carbonClassification": {
        "intensity": 22.3,
        "unit": "kg CO₂/m².an",
        "class": "B",
        "description": "Bonne performance",
        "totalElecKg": 2000.00,
        "totalGasKg": 230.00,
        "totalKg": 2230.00,
        "isApplicable": true
      }
    }
  },
  "metadata": {
    "version": "1.1.0",
    "calculationDate": "2025-12-10T12:00:00.000Z"
  }
}
```

---

## 3. Progressive Tariff System (STEG)

### Formula

STEG uses a progressive tariff structure for Non-résidentiel BT (> 100 kWh/month), where different consumption brackets are charged at different rates.

```
Total Cost = Σ (consumption_in_bracket × bracket_rate)
```

### Tariff Brackets

| Monthly Consumption (kWh) | Rate (DT/kWh) |
|---------------------------|---------------|
| 0 - 200 | 0.195 |
| 200 - 300 | 0.240 |
| 300 - 500 | 0.333 |
| 500+ | 0.391 |

### Example Calculation

For **400 kWh** monthly consumption:

```
First 200 kWh × 0.195 = 39.00 DT
Next 100 kWh × 0.240 = 24.00 DT
Next 100 kWh × 0.333 = 33.30 DT
─────────────────────────────────
Total Monthly Cost = 96.30 DT
Annual Cost = 96.30 × 12 = 1,155.60 DT
Effective Rate = 96.30 / 400 = 0.2408 DT/kWh
```

### Implementation

```typescript
// packages/backend/src/modules/audit-energetique/helpers/progressive-tariff.calculator.ts

export interface ProgressiveTariffResult {
  monthlyCost: number; // DT/month
  annualCost: number; // DT/year
  effectiveRate: number; // DT/kWh (average rate paid)
  bracketDetails: BracketDetail[];
}

export function computeProgressiveTariff(
  input: ProgressiveTariffInput
): ProgressiveTariffResult
```

### Key Features

✅ **Bracket-by-bracket calculation**: Transparent cost breakdown  
✅ **Effective rate calculation**: Shows average rate paid  
✅ **Annual cost projection**: Multiply monthly cost × 12  
✅ **Progressive nature**: Higher consumption = higher effective rate

---

## Future Enhancements

### Potential Improvements

1. **Dynamic Thresholds**: Load from configuration/database
2. **Regional Variations**: Different thresholds per governorate
3. **Historical Tracking**: Track class evolution over time
4. **Benchmarking**: Compare against similar buildings
5. **Certification**: Generate official classification certificates
6. **Multi-language**: Support French/English descriptions
7. **Tariff Updates**: Support for STEG tariff changes over time
8. **Time-of-Use Pricing**: Add peak/off-peak rate support

### Maintenance Notes

- Emission factors should be updated annually based on STEG data
- Thresholds may need adjustment based on regulatory changes
- Consider adding intermediate grades (A+, B-, etc.) in future

---

**Last Updated**: December 10, 2025  
**Version**: 1.1.0  
**Maintainer**: JOYA Development Team

