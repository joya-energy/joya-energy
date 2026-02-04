# Financing Comparison Module

## Overview

The **Financing Comparison Module** is a core business feature of JOYA that enables decision-makers (CFOs, executives) to compare different solar project financing solutions over a standardized **7-year period**.

## Business Objective

Answer one critical question: **"What is the real monthly impact of each solution on my cash flow?"**

All solutions are compared on:
- Same duration (7 years / 84 months)
- Same assumptions
- Monthly payment
- Monthly savings  
- **Net cashflow** (the key metric)

---

## Architecture

This module follows **Clean Architecture** principles as defined in JOYA's coding standards:

```
financing-comparison/
├── services/                    # Business logic layer
│   ├── project-calculator.service.ts
│   ├── cash-solution.service.ts
│   ├── credit-solution.service.ts
│   ├── leasing-solution.service.ts
│   ├── esco-solution.service.ts
│   ├── comparison.service.ts
│   └── *.spec.ts               # Unit tests
├── financing-comparison.repository.ts
└── index.ts

domain/financing/                # Domain layer (shared)
├── types.ts
├── constants.ts
├── errors.ts
└── advantages.ts

interfaces/financing-comparison/ # Interface layer
├── controllers/
│   └── comparison.controller.ts
├── routes/
│   └── comparison.routes.ts
├── dto/
│   └── comparison-request.dto.ts
└── validators/
    └── comparison-request.validator.ts

models/financing-comparison/     # Data layer
└── financing-comparison.model.ts
```

---

## Financing Solutions

### 1. 💵 Paiement Comptant (Cash Payment)
- **Initial Investment**: 100% of CAPEX
- **Monthly Payment**: 0 DT
- **OPEX**: Client manages
- **✅ Advantage**: Maximum cashflow, no debt
- **❌ Disadvantage**: High upfront cost

### 2. 🏦 Crédit Bancaire (Bank Credit)
- **Initial Investment**: 10% of CAPEX (self-financing)
- **Monthly Payment**: Constant annuity over 84 months
- **OPEX**: Client manages
- **Interest Rate**: 9% annual (configurable)
- **✅ Advantage**: Immediate ownership with financing
- **❌ Disadvantage**: Debt on balance sheet

### 3. 📋 Leasing
- **Initial Investment**: 5% of CAPEX
- **Monthly Payment**: Calculated on amortizable amount
- **OPEX**: Increased (×1.3 multiplier for insurance)
- **Interest Rate**: 12% annual (configurable)
- **Residual Value**: 10% of CAPEX
- **✅ Advantage**: Low initial investment
- **❌ Disadvantage**: Highest total cost

### 4. ⭐ ESCO JOYA (Energy Service Company)
- **Initial Investment**: 0 DT
- **Monthly Payment**: Calculated for 13% IRR target
- **OPEX**: Included (managed by JOYA)
- **✅ Advantage**: Zero risk, positive cashflow from month 1
- **❌ Disadvantage**: Shared savings

---

## API Endpoints

### POST `/api/financing-comparisons`
Creates a new financing comparison.

**Request Body:**
```json
{
  "location": "tunis",
  "installationSizeKwp": 50
}
```
OR
```json
{
  "location": "tunis",
  "investmentAmountDt": 125000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "input": { ... },
    "projectCalculation": { ... },
    "cash": { ... },
    "credit": { ... },
    "leasing": { ... },
    "esco": { ... }
  }
}
```

### GET `/api/financing-comparisons/locations`
Returns available locations with their solar yields.

### GET `/api/financing-comparisons/advantages`
Returns advantages/disadvantages for all financing solutions.

---

## Business Rules

### Core Constants
- **Duration**: 7 years (84 months) for ALL solutions
- **ESCO Target IRR**: 16% annual
- **OPEX Rate**: 1.5% of CAPEX annually
- **Cost per kWp**: 2,500 DT
- **Electricity Price**: 0.18 DT/kWh

### Validation Rules
1. User must provide **EITHER** `installationSizeKwp` **OR** `investmentAmountDt`, never both
2. Location must be valid (from predefined list)
3. All rates must be non-negative
4. ESCO payment must not exceed monthly savings

### Calculation Formulas

#### Project Calculations (Common Base)
```typescript
CAPEX = installationSizeKwp × costPerKwpDt
annualProduction = sizeKwp × yieldKwhPerKwpYear
annualSavings = annualProduction × electricityPrice
monthlyOpex = (CAPEX × opexRateAnnual) / 12
```

#### Monthly Payment (Credit/Leasing)
```typescript
monthlyRate = annualRate / 12
monthlyPayment = (principal × monthlyRate) / (1 - (1 + monthlyRate)^(-84))
```

#### ESCO Payment (Target IRR)
```typescript
escoMonthlyIrr = (1 + 0.13)^(1/12) - 1
annuityFactor = (monthlyIrr × (1 + monthlyIrr)^84) / ((1 + monthlyIrr)^84 - 1)
escoPayment = CAPEX × annuityFactor + monthlyOpex
```

#### Cashflow
```typescript
monthlyCashflow = monthlySavings - (monthlyPayment + monthlyOpex)
```

---

## Configuration

All parameters are configurable in `domain/financing/constants.ts`:

```typescript
export const DEFAULT_PROJECT_PARAMETERS = {
  costPerKwpDt: 2500,
  yieldKwhPerKwpYear: 1680,
  electricityPriceDtPerKwh: 0.18,
  opexRateAnnual: 0.015,
};

export const DEFAULT_CREDIT_PARAMETERS = {
  creditAnnualRate: 0.09,
  selfFinancingRate: 0.1,
};

export const DEFAULT_LEASING_PARAMETERS = {
  leasingAnnualRate: 0.12,
  leasingResidualValueRate: 0.10,
  leasingOpexMultiplier: 1.3,
  selfFinancingRate: 0.05,
};

export const DEFAULT_ESCO_PARAMETERS = {
  escoTargetIrrAnnual: 0.13,
  escoOpexIncluded: true,
  escoCostPerKwpDt: 1750, // ESCO-specific cost per kWp (lower than standard 2000 DT)
};
```

---

## Testing

Run tests:
```bash
cd packages/backend
npm test -- financing-comparison
```

Tests cover:
- ✅ Input validation
- ✅ Project calculations
- ✅ Each financing solution
- ✅ Edge cases (zero rates, invalid inputs)
- ✅ IRR calculations
- ✅ ESCO viability checks

---

## Error Handling

Custom error classes in `domain/financing/errors.ts`:
- `InvalidInputError`: Invalid user input
- `CalculationError`: Calculation failure (e.g., ESCO not viable)
- `InvalidLocationError`: Unknown location

All errors are caught at the controller level and returned as structured responses.

---

## Performance

- All calculations are **synchronous** and fast (<10ms)
- No database queries required for calculations
- Stateless services (can be cached)
- Suitable for **real-time comparison**

---

## Frontend Integration

The frontend uses Angular 20+ with signals for reactive state management:

```typescript
import { FinancingComparisonService } from '@app/features/financing-comparison/services';

// Inject service
private financingService = inject(FinancingComparisonService);

// Create comparison
this.financingService.createComparison({
  location: 'tunis',
  installationSizeKwp: 50
}).subscribe();

// Access results via signals
public result = this.financingService.comparisonResult;
public loading = this.financingService.loading;
public error = this.financingService.error;
```

---

## Key Differentiators

### Why ESCO JOYA Stands Out

1. **Zero Initial Investment**: No upfront capital required
2. **Zero Risk**: JOYA manages all technical and operational risks
3. **Positive Cashflow from Day 1**: Client saves money immediately
4. **OPEX Included**: Maintenance, insurance, monitoring all handled by JOYA
5. **Off-Balance Sheet**: No debt impact on financial statements
6. **Aligned Interests**: JOYA only profits when client saves

### DAF Reading (CFO Perspective)

- **Comptant**: "Very profitable, but I'm locking up cash"
- **Crédit**: "I finance the project but take on debt and gain little monthly"
- **Leasing**: "Easy to set up, but expensive over time"
- **ESCO JOYA**: "I take no risk and improve my cash flow immediately"

---

## Future Enhancements

- [ ] Add more Tunisian locations
- [ ] Support custom yield values
- [ ] Add inflation adjustment
- [ ] Support variable electricity prices over time
- [ ] Add sensitivity analysis
- [ ] Export results to PDF
- [ ] Historical comparison tracking
- [ ] Multi-project portfolio analysis

---

## Contributing

When contributing to this module:
1. Follow JOYA's Clean Architecture principles
2. Write tests for all new features
3. Update this README with any changes
4. Use conventional commits
5. Ensure all linters pass

---

## License

Proprietary - JOYA Energy © 2026

