
export const MAX_SURPLUS_FRACTION = 0.3;

export interface PVAutoconsumptionInput {
    /** Eann: annual consumption (kWh/year). */
    annualConsumption: number;
    /** Yspec: annual productible from PVGIS (kWh/kWp/year). */
    annualProductible: number;
    /** T_couv_cible: target coverage rate (0..1). */
    targetCoverageRate: number;
    /** r_auto: self-consumption ratio (0..1). From operating-hours config per case/building/pair. */
    selfConsumptionRatio: number;
}

/** Input when reusing values already calculated by pv-production.calculator (e.g. calculatePVProduction). */
export interface PVAutoconsumptionFromProductionInput {
    /** Eann: annual consumption (kWh/year). */
    annualConsumption: number;
    /** E_PV: annual PV production (kWh/year) from pv-production.calculator. */
    annualPVProduction: number;
    /** P_PV (kWc) from pv-production.calculator; optional, for theoreticalPVPower in result. */
    installedPower?: number;
    /** r_auto: self-consumption ratio (0..1). From operating-hours config. */
    selfConsumptionRatio: number;
}

export interface PVAutoconsumptionResult {
    /** P_PV,th (kWc). */
    theoreticalPVPower: number;
    /** E_PV (kWh/year). */
    annualPVProduction: number;
    /** E_auto (kWh/year). */
    selfConsumedEnergy: number;
    /** E_exc (kWh/year). */
    gridSurplus: number;
    /** T_couv_real as ratio (0..1). */
    actualCoverageRate: number;
    /** Surplus as fraction of E_PV (0..1). %exc = E_exc / E_PV. */
    surplusFraction: number;
    /** True if E_exc ≤ 0.30 × E_PV. */
    surplusWithinLimit: boolean;
}

function round2(value: number): number {
    return Number(value.toFixed(2));
}

/**
 * Theoretical PV power with target coverage.
 * P_PV,th = Eann × T_couv_cible / Yspec [kWc]
 */
export function calculateTheoreticalPVPowerWithTargetCoverage(
    annualConsumption: number,
    targetCoverageRate: number,
    annualProductible: number
): number {
    if (annualProductible === 0) {
        throw new Error('Annual productible (Yspec) is zero, cannot compute theoretical PV power');
    }
    const p = (annualConsumption * targetCoverageRate) / annualProductible;
    return round2(p);
}

/**
 * Annual PV production.
 * E_PV = P_PV × Yspec (kWh/year)
 */
export function calculateAnnualPVProductionFromPower(
    installedPowerKWc: number,
    annualProductible: number
): number {
    return round2(installedPowerKWc * annualProductible);
}

/**
 * Self-consumed energy.
 * E_auto = E_PV × r_auto (kWh/year)
 */
export function calculateSelfConsumedEnergy(
    annualPVProduction: number,
    selfConsumptionRatio: number
): number {
    return round2(annualPVProduction * selfConsumptionRatio);
}

/**
 * Grid surplus (injection).
 * E_exc = E_PV - E_auto (kWh/year)
 */
export function calculateGridSurplus(
    annualPVProduction: number,
    selfConsumedEnergy: number
): number {
    return round2(annualPVProduction - selfConsumedEnergy);
}

/**
 * Actual coverage rate (ratio).
 * T_couv_real = E_PV / Eann (0..1)
 */
export function calculateActualCoverageRate(
    annualPVProduction: number,
    annualConsumption: number
): number {
    if (annualConsumption === 0) {
        return 0;
    }
    return round2(annualPVProduction / annualConsumption);
}

/**
 * Surplus as fraction of annual PV production.
 * %exc = E_exc / E_PV (0..1)
 */
export function calculateSurplusFraction(
    gridSurplus: number,
    annualPVProduction: number
): number {
    if (annualPVProduction === 0) {
        return 0;
    }
    return round2(gridSurplus / annualPVProduction);
}

/**
 * Check 30 % rule: E_exc ≤ 0.30 × E_PV.
 */
export function isSurplusWithinLimit(
    gridSurplus: number,
    annualPVProduction: number,
    maxFraction: number = MAX_SURPLUS_FRACTION
): boolean {
    if (annualPVProduction === 0) {
        return true;
    }
    return gridSurplus / annualPVProduction <= maxFraction;
}


export function computePVAutoconsumption(input: PVAutoconsumptionInput): PVAutoconsumptionResult {
    const theoreticalPVPower = calculateTheoreticalPVPowerWithTargetCoverage(
        input.annualConsumption,
        input.targetCoverageRate,
        input.annualProductible
    );

    const annualPVProduction = calculateAnnualPVProductionFromPower(
        theoreticalPVPower,
        input.annualProductible
    );

    const selfConsumedEnergy = calculateSelfConsumedEnergy(
        annualPVProduction,
        input.selfConsumptionRatio
    );

    const gridSurplus = calculateGridSurplus(annualPVProduction, selfConsumedEnergy);

    const actualCoverageRate = calculateActualCoverageRate(
        annualPVProduction,
        input.annualConsumption
    );

    const surplusFraction = calculateSurplusFraction(gridSurplus, annualPVProduction);

    const surplusWithinLimit = isSurplusWithinLimit(gridSurplus, annualPVProduction);

    return {
        theoreticalPVPower,
        annualPVProduction,
        selfConsumedEnergy,
        gridSurplus,
        actualCoverageRate,
        surplusFraction,
        surplusWithinLimit,
    };
}


export function computePVAutoconsumptionFromProduction(
    input: PVAutoconsumptionFromProductionInput
): PVAutoconsumptionResult {
    const { annualConsumption, annualPVProduction, installedPower, selfConsumptionRatio } = input;

    const selfConsumedEnergy = calculateSelfConsumedEnergy(
        annualPVProduction,
        selfConsumptionRatio
    );

    const gridSurplus = calculateGridSurplus(annualPVProduction, selfConsumedEnergy);

    const actualCoverageRate = calculateActualCoverageRate(
        annualPVProduction,
        annualConsumption
    );

    const surplusFraction = calculateSurplusFraction(gridSurplus, annualPVProduction);

    const surplusWithinLimit = isSurplusWithinLimit(gridSurplus, annualPVProduction);

    return {
        theoreticalPVPower: installedPower ?? 0,
        annualPVProduction,
        selfConsumedEnergy,
        gridSurplus,
        actualCoverageRate,
        surplusFraction,
        surplusWithinLimit,
    };
}
