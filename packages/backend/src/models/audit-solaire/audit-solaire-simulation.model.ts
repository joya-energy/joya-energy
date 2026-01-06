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
    annualConsumption: { type: Number, required: true, min: 0 },
    annualProductible: { type: Number, required: true, min: 0 },
    expectedProduction: { type: Number, required: true, min: 0 },
    systemSize_kWp: { type: Number, required: true, min: 0 },
    installationCost: { type: Number, required: true, min: 0 },
    annualSavings: { type: Number, required: true, min: 0 },
    coverage: { type: Number, required: true, min: 0 },
    paybackYears: { type: Number, required: true, min: 0 },
    // Financial metrics from economic analysis
    // Note: These are optional to handle old records, but should always be present for new records
    npv: { type: Number, required: false },
    irr: { type: Number, required: false },
    roi25Years: { type: Number, required: false },
    simplePaybackYears: { type: Number, required: false },
    discountedPaybackYears: { type: Number, required: false },
    totalSavings25Years: { type: Number, required: false }
  },
  {
    timestamps: true
  }
);
