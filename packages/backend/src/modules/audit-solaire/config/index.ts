export * from './extrapolation-coefficients.config';
export { SOLAR_SIMULATION_MONTHS, type SolarSimulationMonth, type SolarClimateZone, type SolarBuildingCategory } from './extrapolation-coefficients.config';

export {
    OPERATING_HOURS_CASES,
    OPERATING_HOURS_COEFFICIENTS,
    OPERATING_HOURS_PAIR_INDEXES,
    getCoverageRate,
    getSelfConsumptionRatio,
    getOperatingHoursRow,
    type OperatingHoursCase,
    type OperatingHoursRow,
    type OperatingHoursPairIndex,
} from './operating-hours-matrices.config';
