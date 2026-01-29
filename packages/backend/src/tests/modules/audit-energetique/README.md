# Audit Énergétique Test Suite

## Overview
Comprehensive unit test coverage for the Energy Audit simulation module following Clean Architecture principles and SOLID design patterns.

## Test Structure

```
tests/modules/audit-energetique/
├── helpers/                              # Helper function tests (business logic)
│   ├── envelope.calculator.spec.ts       # Building envelope calculations
│   ├── usage.calculator.spec.ts          # Usage factor calculations
│   ├── hvac.calculator.spec.ts           # HVAC load calculations
│   ├── equipment.calculator.spec.ts      # Equipment load calculations
│   ├── ecs.calculator.spec.ts            # Domestic hot water calculations
│   ├── tariff.calculator.spec.ts         # Tariff & intensity calculations
│   ├── recommendation.builder.spec.ts    # Recommendation generation logic
│   ├── emissions.calculator.spec.ts      # CO₂ emissions calculations
│   ├── energy-class.calculator.spec.ts   # Energy classification (BECTh)
│   └── energy-split.calculator.spec.ts   # Electricity/gas split logic
├── dto/
│   └── audit-energetique-response.dto.spec.ts  # DTO transformation tests
├── audit-energetique.service.spec.ts     # Service layer tests
└── audit-energetique.controller.spec.ts  # Controller layer tests
```

## Coverage Summary

### ✅ Helper Functions (10 test files)
Pure business logic functions tested in isolation:

1. **envelope.calculator.spec.ts**
   - Building envelope factor calculation (insulation × glazing × ventilation)
   - Compactness factor based on floor count
   - Edge cases for different building configurations

2. **usage.calculator.spec.ts**
   - Annualized usage factor from operating schedule
   - 24/7 operation handling (52 weeks ≈ 365 days)
   - Upper bound capping at 1.0
   - Lower bound protection (no negative values)

3. **hvac.calculator.spec.ts**
   - Heating and cooling load calculations
   - Climate-based adjustments (North/Center/South)
   - System type handling (electric, gas, reversible AC)
   - Coverage factor application
   - No-system scenarios

4. **equipment.calculator.spec.ts**
   - Equipment loads by category
   - 24/7 vs. usage-based equipment
   - Pharmacy-specific refrigeration thresholds
   - Surface-based load adjustments

5. **ecs.calculator.spec.ts**
   - Electric water heater (η = 1.0)
   - Gas systems with efficiency losses (η = 0.92)
   - Solar systems (70% coverage + 30% backup)
   - Heat pump systems (COP = 3.0)
   - No ECS scenario

6. **tariff.calculator.spec.ts**
   - Monthly bill to annual consumption conversion
   - Energy intensity (kWh/m²/year)
   - Tariff type handling (BT/MT/HT)
   - Zero and edge case protection

7. **recommendation.builder.spec.ts**
   - LED upgrade recommendations
   - Insulation improvement suggestions
   - HVAC optimization tips
   - Solar PV recommendations
   - Savings potential estimation (5-40%)

8. **emissions.calculator.spec.ts**
   - CO₂ from electricity (0.512 kg/kWh)
   - CO₂ from natural gas (0.202 kg/kWh)
   - Total emissions and tons conversion
   - Custom emission factors

9. **energy-class.calculator.spec.ts**
   - BECTh calculation for offices
   - Energy class assignment (Classe 1-8)
   - Non-applicable building types
   - Invalid surface handling

10. **energy-split.calculator.spec.ts**
    - Electricity vs. gas consumption split
    - Gas boiler heating attribution
    - Gas ECS attribution
    - All-electric systems

### ✅ DTO Layer (1 test file)
Data transformation and response structure:

**audit-energetique-response.dto.spec.ts**
- Simulation to DTO transformation
- Contact, building, envelope, systems sections
- Energy consumption with units
- CO₂ emissions calculations
- Per-m² calculations
- Energy classification (applicable/not applicable)
- Optional field handling
- Unit correctness validation

### ✅ Service Layer (1 test file)
Business orchestration and domain logic:

**audit-energetique.service.spec.ts**
- `createSimulation()`: Full calculation pipeline
  - Envelope factor calculation
  - HVAC loads computation
  - Equipment loads integration
  - ECS calculations
  - CO₂ emissions
  - Energy class (offices only)
  - Pharmacy-specific cold loads
- `getSimulationById()`: Retrieval with error handling
- `deleteSimulation()`: Deletion with error handling
- Repository interaction mocking
- Error scenarios (404 not found)

### ✅ Controller Layer (1 test file)
HTTP request/response handling and validation:

**audit-energetique.controller.spec.ts**
- `createSimulation()`: POST /audit-energetique-simulations
  - Zod schema validation
  - 201 Created response
  - Invalid email rejection
  - Missing field validation
  - Surface area validation (positive)
  - Operating hours validation (1-24)
  - Operating days validation (1-7)
  - hasRecentBill + recentBillConsumption cross-validation
  - Optional fields handling
  - Service error propagation
- `getSimulationById()`: GET /audit-energetique-simulations/:id
  - 200 OK response
  - 404 Not Found handling
- `deleteSimulation()`: DELETE /audit-energetique-simulations/:id
  - 204 No Content response
  - Error handling

## Running Tests

```bash
# Run all audit énergétique tests
cd packages/backend
npm test -- audit-energetique

# Run specific test file
npm test -- helpers/usage.calculator.spec.ts

# Run with coverage
npm run test:coverage -- audit-energetique

# Watch mode for development
npm run test:w -- audit-energetique
```

## Test Principles

### 1. **Isolation**
- Each test is independent and can run in any order
- External dependencies are mocked (repository, logger, env vars)
- No database connections required

### 2. **Clarity**
- Descriptive test names: `should calculate X when Y`
- Arrange-Act-Assert pattern
- Clear expected values with comments

### 3. **Coverage**
- Normal cases (happy path)
- Edge cases (boundaries, limits)
- Error cases (invalid input, not found)
- Optional/required field combinations

### 4. **Clean Architecture Compliance**
- Helpers: Pure functions, no dependencies
- Service: Business logic orchestration, mocked repository
- Controller: HTTP concerns, mocked service
- DTO: Data transformation, no side effects

## Mocking Strategy

### Environment Variables
```typescript
process.env.ENERGY_AUDIT_K_CH = '0.2';
process.env.ENERGY_AUDIT_K_FR = '0.3';
process.env.ENERGY_COST_PER_KWH = '0.35';
// ... etc
```

### Repository Mocking
```typescript
jest.mock('../../../modules/audit-energetique/audit-energetique.repository');
mockRepository.create = jest.fn().mockResolvedValue(mockSimulation);
```

### Service Mocking (for controller tests)
```typescript
jest.mock('../../../modules/audit-energetique/audit-energetique.service', () => ({
  auditSimulationService: {
    createSimulation: jest.fn(),
    getSimulationById: jest.fn(),
    deleteSimulation: jest.fn()
  }
}));
```

## Key Test Data

### Valid Simulation Input
```typescript
{
  buildingType: BuildingTypes.PHARMACY,
  surfaceArea: 100,
  floors: 1,
  openingDaysPerWeek: 6,
  openingHoursPerDay: 10,
  insulation: InsulationQualities.MEDIUM,
  climateZone: ClimateZones.NORTH,
  // ... etc
}
```

### Expected Outputs
- Annual consumption: > 0 kWh/year
- CO₂ emissions: > 0 kg/year
- Energy cost: consumption × tariff
- Per-m² values: total / surface area

## Debugging Failed Tests

### Common Issues

1. **Floating-point precision**
   ```typescript
   // Use toBeCloseTo instead of toBe for decimals
   expect(result).toBeCloseTo(88.889, 2); // 2 decimal places
   ```

2. **52 weeks ≠ 365 days**
   ```typescript
   // 24/7 operation: 24 × 7 × 52 = 8736h < 8760h (year)
   expect(usageFactor).toBeCloseTo(0.997, 2); // Not 1.0!
   ```

3. **Mock not reset**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks(); // Always clear between tests
   });
   ```

4. **Async/await missing**
   ```typescript
   // Always await async functions in tests
   await expect(service.method()).rejects.toThrow();
   ```

## Future Enhancements

- [ ] Integration tests with real database
- [ ] E2E tests with full HTTP stack
- [ ] Performance/load testing for bulk calculations
- [ ] Property-based testing for helper functions
- [ ] Mutation testing for edge case coverage

## Maintenance

When adding new features:
1. Write test first (TDD)
2. Keep tests focused on single behavior
3. Update this README with new test coverage
4. Ensure tests follow existing patterns
5. Run full test suite before committing

## Related Documentation

- [Calculation Methodology](../../../modules/audit-energetique/CALCULATION_METHODOLOGY.md)
- [API Routes Documentation](../../../modules/audit-energetique/audit-energetique.routes.ts)
- [Cursor Rules](.cursorrules) - Project coding standards

