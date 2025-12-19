import { Logger } from '@backend/middlewares';
import { CLIMATIC_COEFFICIENTS, BUILDING_TYPE_COEFFICIENTS, SOLAR_SIMULATION_MONTHS } from '../config';
import { BuildingTypes, ClimateZones } from '@shared/enums/audit-general.enum';


export interface ConsumptionExtrapolationInput {
    measuredConsumption: number; // EM: Consommation électrique mesurée sur un mois donné (kWh)
    referenceMonth: number; // M: Mois de référence (1-12)
    buildingType: BuildingTypes;
    climateZone: ClimateZones;
}

export interface MonthlyConsumption {
    month: number;
    rawConsumption: number;
    estimatedConsumption: number;
    climaticCoefficient: number;
    buildingCoefficient: number;
    effectiveCoefficient: number;
}

export interface ConsumptionExtrapolationResult {
    baseConsumption: number; // Base énergétique normalisée
    monthlyConsumptions: MonthlyConsumption[];
    annualEstimatedConsumption: number;
}

export function calculateEffectiveCoefficient(month: number, buildingType: BuildingTypes, climateZone: ClimateZones): number {
    const monthName = SOLAR_SIMULATION_MONTHS[month - 1]; 
    const buildingCoeff = BUILDING_TYPE_COEFFICIENTS[buildingType]?.[monthName] ?? 1;
    const climaticCoeff = CLIMATIC_COEFFICIENTS[climateZone]?.[monthName] ?? 1;
    return buildingCoeff * climaticCoeff;
}

export function calculateEnergyBase(input: ConsumptionExtrapolationInput): number {
    const effectiveCoeff = calculateEffectiveCoefficient(input.referenceMonth, input.buildingType, input.climateZone);

    if (effectiveCoeff === 0) {
        Logger.warn(`Effective coefficient is zero for month ${input.referenceMonth}, building ${input.buildingType}, zone ${input.climateZone}`);
        return input.measuredConsumption;
    }
    Logger.info(`Effective coefficient: ${effectiveCoeff}`);
    Logger.info(`Measured consumption: ${input.measuredConsumption}`);
    Logger.info(`Base consumption: ${input.measuredConsumption / effectiveCoeff}`);

    return input.measuredConsumption / effectiveCoeff;
}

/**
 * Estimate monthly consumption for all months
 * Eestimé(m) = Base × Ki(m,type) × Kzone(m,zone)
 */
export function extrapolateMonthlyConsumption(
    baseConsumption: number,
    buildingType: BuildingTypes,
    climateZone: ClimateZones
): MonthlyConsumption[] {
    const monthlyConsumptions: MonthlyConsumption[] = [];

    for (let monthIndex = 0; monthIndex < SOLAR_SIMULATION_MONTHS.length; monthIndex++) {
        const month = monthIndex + 1; // 1-based month number
        const monthName = SOLAR_SIMULATION_MONTHS[monthIndex];
        Logger.info(`Month name: ${monthName}`);

        const buildingCoeff = BUILDING_TYPE_COEFFICIENTS[buildingType]?.[monthName] ?? 1;
        const climaticCoeff = CLIMATIC_COEFFICIENTS[climateZone]?.[monthName] ?? 1;
        const effectiveCoeff = buildingCoeff * climaticCoeff;
        const estimatedConsumption = baseConsumption * effectiveCoeff;

        monthlyConsumptions.push({
            month,
            rawConsumption: 0,
            estimatedConsumption: Number(estimatedConsumption.toFixed(2)),
            climaticCoefficient: climaticCoeff,
            buildingCoefficient: buildingCoeff,
            effectiveCoefficient: Number(effectiveCoeff.toFixed(4)),
        });
    }

    return monthlyConsumptions;
}

/**
 * Calculate annual estimated consumption
 * Eannuel estimé = Σ Eestimé(m) for m=1 to 12
 */
export function calculateAnnualConsumption(monthlyConsumptions: MonthlyConsumption[]): number {
    const total = monthlyConsumptions.reduce((sum, month) => sum + month.estimatedConsumption, 0);
    return Number(total.toFixed(2));
}

/**
 * Main function to extrapolate consumption from one month to annual
 */
export function extrapolateConsumption(input: ConsumptionExtrapolationInput): ConsumptionExtrapolationResult {
    Logger.info(`Extrapolating consumption for building type ${input.buildingType}, zone ${input.climateZone}, month ${input.referenceMonth}`);

    const baseConsumption = calculateEnergyBase(input);
    const monthlyConsumptions = extrapolateMonthlyConsumption(baseConsumption, input.buildingType, input.climateZone);
    const annualEstimatedConsumption = calculateAnnualConsumption(monthlyConsumptions);

    Logger.info(`Base consumption: ${baseConsumption}, Annual estimated: ${annualEstimatedConsumption}`);

    return {
        baseConsumption: Number(baseConsumption.toFixed(2)),
        monthlyConsumptions,
        annualEstimatedConsumption,
    };
}
