import { type Model, type Document } from 'mongoose';
import { type ObjectId } from 'mongodb';
import { buildSchema } from '@backend/common/BaseSchema';
import { ModelsCollection } from '@backend/enums';
import { type IAuditSolaireSimulation } from '@shared/interfaces';

export type AuditSolaireSimulationDocument = IAuditSolaireSimulation & Document<ObjectId>;

export const AuditSolaireSimulationModel: Model<AuditSolaireSimulationDocument> = buildSchema<AuditSolaireSimulationDocument>(
  ModelsCollection.AUDIT_SOLAIRE_SIMULATION,
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    measuredAmount: { type: Number, required: true, min: 0 },
    referenceMonth: { type: Number, required: true, min: 1, max: 12 },
    annualConsumption: { type: Number, required: true, min: 0 },
    annualProductible: { type: Number, required: true, min: 0 },
    expectedProduction: { type: Number, required: true, min: 0 },
    systemSize_kWp: { type: Number, required: true, min: 0 },
    installationCost: { type: Number, required: true, min: 0 },
    annualSavings: { type: Number, required: true, min: 0 },
    coverage: { type: Number, required: true, min: 0 },
    annualBillWithoutPV: { type: Number, required: true, min: 0 },
    annualBillWithPV: { type: Number, required: true, min: 0 },
    averageAnnualSavings: { type: Number, required: true, min: 0 },
    paybackMonths: { type: Number, required: true, min: 0 }
  },
  {
    timestamps: true
  }
);
