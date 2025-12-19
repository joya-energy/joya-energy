import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';

// Import matrix data from JSON files
import climateMatrix from './solar-climate.matrix.json';
import buildingMatrix from './solar-building.matrix.json';

export const SOLAR_SIMULATION_MONTHS = [
    'janvier',
    'fevrier',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'decembre'
] as const;

export type SolarSimulationMonth = typeof SOLAR_SIMULATION_MONTHS[number];
export type SolarClimateZone = keyof typeof climateMatrix;
export type SolarBuildingCategory = keyof typeof buildingMatrix.janvier;

type MonthlyValues = Record<SolarSimulationMonth, number>;

const MONTH_ORDER = [...SOLAR_SIMULATION_MONTHS] as const;
const BUILDING_ORDER = [...Object.values(BuildingTypes)] as const;
const CLIMATIC_ZONE_ORDER = [...Object.values(ClimateZones)] as const;

// Validation and utility functions
const assertLength = (values: readonly number[], expected: number, context: string): void => {
    if (values.length !== expected) {
        throw new Error(`Invalid ${context}: expected ${expected} entries, received ${values.length}`);
    }
};

const buildMonthlyValues = (values: readonly number[], context: string): MonthlyValues => {
    assertLength(values, MONTH_ORDER.length, context);
    return MONTH_ORDER.reduce<MonthlyValues>((acc, month, index) => {
        acc[month] = values[index] ?? 0;
        return acc;
    }, {} as MonthlyValues);
};

// Validate climate matrix
const validateClimateMatrix = (matrix: Record<string, number[]>): void => {
    const zones = Object.keys(matrix);
    for (const zone of zones) {
        if (!CLIMATIC_ZONE_ORDER.includes(zone as typeof CLIMATIC_ZONE_ORDER[number])) {
            throw new Error(`Invalid climate zone in matrix: ${zone}`);
        }
    }
};

validateClimateMatrix(climateMatrix);

// Build climatic coefficients
export const CLIMATIC_COEFFICIENTS: Record<SolarClimateZone, MonthlyValues> = Object.entries(
    climateMatrix as Record<SolarClimateZone, readonly number[]>
).reduce(
    (acc, [zone, values]) => {
        acc[zone as SolarClimateZone] = buildMonthlyValues(values, `climatic coefficients for ${zone}`);
        return acc;
    },
    {} as Record<SolarClimateZone, MonthlyValues>
);

// Validate building matrix
const validateBuildingMatrix = (matrix: Record<string, number[]>): void => {
    const months = Object.keys(matrix);
    for (const month of months) {
        if (!SOLAR_SIMULATION_MONTHS.includes(month as SolarSimulationMonth)) {
            throw new Error(`Invalid month in building matrix: ${month}`);
        }
    }
};

validateBuildingMatrix(buildingMatrix);

// Build building usage coefficients
export const BUILDING_USAGE_COEFFICIENTS: Record<BuildingTypes, MonthlyValues> = BUILDING_ORDER.reduce(
    (acc, category, categoryIndex) => {
        const monthlyValues = MONTH_ORDER.map((month) => {
            const usageRow = (buildingMatrix as Record<SolarSimulationMonth, readonly number[]>)[month];
            assertLength(usageRow, BUILDING_ORDER.length, `building coefficients for ${month}`);
            return usageRow[categoryIndex] ?? 0;
        });

        acc[category] = buildMonthlyValues(monthlyValues, `building category ${category}`);
        return acc;
    },
    {} as Record<BuildingTypes, MonthlyValues>
);

export const BUILDING_TYPE_COEFFICIENTS = BUILDING_USAGE_COEFFICIENTS;
