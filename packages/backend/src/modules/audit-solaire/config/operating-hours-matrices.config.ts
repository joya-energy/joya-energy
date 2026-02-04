import { BuildingTypes } from '@shared/enums/audit-general.enum';

import jourSoirMatrix from './operating-hours-jour-soir.matrix.json';
import jourMatrix from './operating-hours-jour.matrix.json';
import matrix24_7 from './operating-hours-24-7.matrix.json';

export const OPERATING_HOURS_CASES = [
    'jour_soir',
    'jour',
    '24_7',
] as const;

export type OperatingHoursCase = (typeof OPERATING_HOURS_CASES)[number];

/** Index 1..5 for each (coverage rate, self-consumption ratio) pair in a row */
export const OPERATING_HOURS_PAIR_INDEXES = [1, 2, 3, 4, 5] as const;
export type OperatingHoursPairIndex = (typeof OPERATING_HOURS_PAIR_INDEXES)[number];

export type OperatingHoursRow = readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
];

const CASE_ORDER = [...OPERATING_HOURS_CASES] as const;
const BUILDING_ORDER = [...Object.values(BuildingTypes)] as const;
const ROW_LENGTH = 10;

/** Enum value (label) → enum key for JSON lookup */
const BUILD_TYPE_TO_KEY: Record<string, string> = Object.fromEntries(
    (Object.entries(BuildingTypes) as [string, string][]).map(([k, v]) => [v, k])
);

const assertLength = (values: readonly number[], expected: number, context: string): void => {
    if (values.length !== expected) {
        throw new Error(`Invalid ${context}: expected ${expected} entries, received ${values.length}`);
    }
};

const validateOperatingHoursMatrix = (
    matrix: Record<string, number[]>,
    caseKey: OperatingHoursCase
): void => {
    for (const buildingType of BUILDING_ORDER) {
        const key = BUILD_TYPE_TO_KEY[buildingType];
        if (!key) {
            throw new Error(`Unknown building type: ${buildingType}`);
        }
        const row = matrix[key];
        if (!row || !Array.isArray(row)) {
            throw new Error(`Missing operating-hours row: case=${caseKey}, buildingType=${buildingType}`);
        }
        assertLength(row, ROW_LENGTH, `operating-hours row for case=${caseKey}, buildingType=${buildingType}`);
    }
};

const rawMatrices: Record<OperatingHoursCase, Record<string, number[]>> = {
    jour_soir: jourSoirMatrix as Record<string, number[]>,
    jour: jourMatrix as Record<string, number[]>,
    '24_7': matrix24_7 as Record<string, number[]>,
};

for (const caseKey of CASE_ORDER) {
    validateOperatingHoursMatrix(rawMatrices[caseKey], caseKey);
}

export const OPERATING_HOURS_COEFFICIENTS: Record<
    OperatingHoursCase,
    Record<BuildingTypes, OperatingHoursRow>
> = CASE_ORDER.reduce(
    (acc, caseKey) => {
        acc[caseKey] = BUILDING_ORDER.reduce(
            (inner, buildingType) => {
                const key = BUILD_TYPE_TO_KEY[buildingType]!;
                const row = rawMatrices[caseKey][key];
                inner[buildingType] = row as unknown as OperatingHoursRow;
                return inner;
            },
            {} as Record<BuildingTypes, OperatingHoursRow>
        );
        return acc;
    },
    {} as Record<OperatingHoursCase, Record<BuildingTypes, OperatingHoursRow>>
);

function getRow(caseKey: OperatingHoursCase, buildingType: BuildingTypes): OperatingHoursRow {
    const byCase = OPERATING_HOURS_COEFFICIENTS[caseKey];
    if (!byCase) {
        throw new Error(`Unknown operating hours case: ${caseKey}`);
    }
    const row = byCase[buildingType];
    if (!row) {
        throw new Error(`Unknown building type for operating hours: ${buildingType}`);
    }
    return row;
}

/** Coverage rate (T_couv_X, taux de couverture) for case, building type, pair index 1..5 */
export function getCoverageRate(
    caseKey: OperatingHoursCase,
    buildingType: BuildingTypes,
    pairIndex: OperatingHoursPairIndex
): number {
    const row = getRow(caseKey, buildingType);
    const i = (pairIndex - 1) * 2;
    const value = row[i];
    if (value === undefined) {
        throw new Error(
            `Missing coverage rate (T_couv_${pairIndex}) for case=${caseKey}, buildingType=${buildingType}`
        );
    }
    return value;
}

/** Self-consumption ratio (r_auto_X, ratio d'autoconsommation) for case, building type, pair index 1..5 */
export function getSelfConsumptionRatio(
    caseKey: OperatingHoursCase,
    buildingType: BuildingTypes,
    pairIndex: OperatingHoursPairIndex
): number {
    const row = getRow(caseKey, buildingType);
    const i = (pairIndex - 1) * 2 + 1;
    const value = row[i];
    if (value === undefined) {
        throw new Error(
            `Missing self-consumption ratio (r_auto_${pairIndex}) for case=${caseKey}, buildingType=${buildingType}`
        );
    }
    return value;
}

export function getOperatingHoursRow(
    caseKey: OperatingHoursCase,
    buildingType: BuildingTypes
): OperatingHoursRow {
    return getRow(caseKey, buildingType);
}
