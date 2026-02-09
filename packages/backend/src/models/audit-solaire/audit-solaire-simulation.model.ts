import { type Model, type Document } from 'mongoose';
import { type ObjectId } from 'mongodb';
import { buildSchema } from '@backend/common/BaseSchema';
import { ModelsCollection } from '@backend/enums';
import { type IAuditSolaireSimulation } from '@shared/interfaces';

export type AuditSolaireSimulationDocument = IAuditSolaireSimulation & Document<ObjectId>;

export const AuditSolaireSimulationModel: Model<AuditSolaireSimulationDocument> = buildSchema<AuditSolaireSimulationDocument>(
  ModelsCollection.AUDIT_SOLAIRE_SIMULATION,
  {
    address: { type: String, required: false },
    fullName: { type: String, required: false },
    companyName: { type: String, required: false },
    email: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    measuredAmount: { type: Number, required: true, min: 0 },
    referenceMonth: { type: Number, required: true, min: 1, max: 12 },
    annualConsumption: { type: Number, required: true, min: 0 },
    annualProductible: { type: Number, required: true, min: 0 },
    expectedProduction: { type: Number, required: true, min: 0 },
    systemSize_kWp: { type: Number, required: true, min: 0 },
    installationCost: { type: Number, required: true, min: 0 },
    annualOpex: { type: Number, required: true, min: 0 },
    annualSavings: { type: Number, required: true, min: 0 },
    coverage: { type: Number, required: true, min: 0 },
    annualBillWithoutPV: { type: Number, required: true, min: 0 },
    annualBillWithPV: { type: Number, required: true, min: 0 },
    averageAnnualSavings: { type: Number, required: true, min: 0 },
    paybackMonths: { type: Number, required: true, min: 0 },
    simplePaybackYears: { type: Number, required: false, min: 0 },
    discountedPaybackYears: { type: Number, required: false, min: 0 },
    roi25Years: { type: Number, required: false },
    npv: { type: Number, required: false },
    irr: { type: Number, required: true },
    annualCo2Avoided: { type: Number, required: true, min: 0 },
    totalCo2Avoided25Years: { type: Number, required: true, min: 0 },
    monthlyEconomics: [{
      month: { type: Number, required: true, min: 1, max: 12 },
      rawConsumption: { type: Number, required: true, min: 0 },
      billedConsumption: { type: Number, required: true, min: 0 },
      appliedTariffRate: { type: Number, required: true, min: 0 },
      billWithoutPV: { type: Number, required: true, min: 0 },
      billWithPV: { type: Number, required: true, min: 0 },
      monthlySavings: { type: Number, required: true }
    }],
    annualEconomics: [{
      year: { type: Number, required: true },
      annualRawConsumption: { type: Number, required: true },
      annualBilledConsumption: { type: Number, required: true },
      annualBillWithoutPV: { type: Number, required: true },
      annualBillWithPV: { type: Number, required: true },
      annualSavings: { type: Number, required: true },
      averageAvoidedTariff: { type: Number, required: true },
      capex: { type: Number, required: true },
      opex: { type: Number, required: true },
      netGain: { type: Number, required: true },
      cumulativeCashFlow: { type: Number, required: true },
      cumulativeCashFlowDiscounted: { type: Number, required: true },
      cumulativeNetGain: { type: Number, required: true },
      cumulativeNetGainDiscounted: { type: Number, required: true }
    }],
    // Optional MT (Moyenne Tension) autoconsumption fields
    mtPairIndex: { type: Number, required: false }, // Chosen pair 1..5 (highest T_couv with excedent < 30%)
    mtOperatingHoursCase: { type: String, required: false },
    mtCoverageRate: { type: Number, required: false },
    mtSelfConsumptionRatio: { type: Number, required: false },
    mtTheoreticalPVPower: { type: Number, required: false },
    mtAnnualPVProduction: { type: Number, required: false },
    mtSelfConsumedEnergy: { type: Number, required: false },
    mtGridSurplus: { type: Number, required: false },
    mtActualCoverageRate: { type: Number, required: false },
    mtSurplusFraction: { type: Number, required: false },
    mtSurplusWithinLimit: { type: Boolean, required: false }
  },
  {
    timestamps: true
  }
);
