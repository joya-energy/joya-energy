import { Logger } from '@backend/middlewares';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';
import {
    CLIMATIC_COEFFICIENTS,
    BUILDING_TYPE_COEFFICIENTS,
    SOLAR_SIMULATION_MONTHS,
    type SolarClimateZone,
    type SolarSimulationMonth,
} from '../config';
import {
    calculateEnergyBase,
    extrapolateMonthlyConsumption,
    calculateAnnualConsumption,
    type ConsumptionExtrapolationInput,
    type ConsumptionExtrapolationResult,
    type MonthlyConsumption,
} from './consumption-extrapolation.calculator';

export type EstimatedConsumptionFormulasInput = ConsumptionExtrapolationInput;

/** Re-export so callers can use the same types. */
export type { MonthlyConsumption, ConsumptionExtrapolationResult };


export function getKi(month: number, buildingType: BuildingTypes): number {
    const monthName = SOLAR_SIMULATION_MONTHS[month - 1] as SolarSimulationMonth;
    const value = BUILDING_TYPE_COEFFICIENTS[buildingType]?.[monthName];
    if (value === undefined) {
        throw new Error(
            `Unknown building type or month: buildingType=${buildingType}, month=${month}`
        );
    }
    return value;
}

export function getKzone(month: number, climateZone: ClimateZones): number {
    const monthName = SOLAR_SIMULATION_MONTHS[month - 1] as SolarSimulationMonth;
    const value = CLIMATIC_COEFFICIENTS[climateZone as SolarClimateZone]?.[monthName];
    if (value === undefined) {
        throw new Error(
            `Unknown climate zone or month: climateZone=${climateZone}, month=${month}`
        );
    }
    return value;
}

export function reconstituteMonthlyEstimatedConsumption(
    input: EstimatedConsumptionFormulasInput
): { baseConsumption: number; monthlyConsumptions: MonthlyConsumption[] } {
    const baseConsumption = calculateEnergyBase(input);
    const monthlyConsumptions = extrapolateMonthlyConsumption(
        baseConsumption,
        input.buildingType,
        input.climateZone
    );
    return { baseConsumption, monthlyConsumptions };
}


export function computeAnnualEstimatedConsumption(
    monthlyConsumptions: MonthlyConsumption[]
): number {
    return calculateAnnualConsumption(monthlyConsumptions);
}


export function computeEstimatedConsumptionFormulas(
    input: EstimatedConsumptionFormulasInput
): ConsumptionExtrapolationResult {
    const { baseConsumption, monthlyConsumptions } = reconstituteMonthlyEstimatedConsumption(input);
    const annualEstimatedConsumption = computeAnnualEstimatedConsumption(monthlyConsumptions);

    Logger.info(`Annual estimated consumption: ${annualEstimatedConsumption}`);

    return {
        baseConsumption: Number(baseConsumption.toFixed(2)),
        monthlyConsumptions,
        annualEstimatedConsumption,
    };
}
