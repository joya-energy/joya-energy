import {
    InsulationQualities,
    GlazingTypes,
    VentilationSystems,
    ConditionedCoverage,
    Floors
} from '@shared/enums/audit-batiment.enum';

//Isolation factors
export const INSULATION_FACTORS: Record<InsulationQualities, number> = {
    [InsulationQualities.LOW]: 1.2,
    [InsulationQualities.MEDIUM]: 1.0,
    [InsulationQualities.HIGH]: 0.9
};


//Facteur de vitrage
export const GLAZING_FACTORS: Record<GlazingTypes, number> = {
    [GlazingTypes.SINGLE]: 1.1,
    [GlazingTypes.DOUBLE]: 1.0
};

//VMC factors
export const VENTILATION_FACTORS: Record<VentilationSystems, number> = {
    [VentilationSystems.NONE]: 1.0,
    [VentilationSystems.SINGLE_FLOW]: 1.05,
    [VentilationSystems.DOUBLE_FLOW]: 0.95
};

//Facteur de compacité
export const COMPACTNESS_FACTORS: Record<Floors, number> = {
    [Floors.SINGLE]: 1.0,
    [Floors.TWO_OR_THREE]: 0.95,
    [Floors.FOUR_OR_MORE]: 0.9
};

//Facteur de climatisation
export const COOLING_COVERAGE_FACTORS: Record<ConditionedCoverage, number> = {
    [ConditionedCoverage.FEW_ROOMS]: 0.3,
    [ConditionedCoverage.HALF_BUILDING]: 0.6,
    [ConditionedCoverage.MOST_BUILDING]: 1.0
};

export const FOUR_OR_MORE_FLOORS_THRESHOLD = 4;
export const TWO_OR_THREE_FLOORS_THRESHOLD = 2;

