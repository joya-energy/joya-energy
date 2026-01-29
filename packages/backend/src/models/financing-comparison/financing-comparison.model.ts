/**
 * Financing Comparison Model
 * MongoDB schema for storing financing comparison results
 */

import { type Model, type Document } from 'mongoose';
import { buildSchema } from '@backend/common/BaseSchema';
import { type ObjectId } from 'mongodb';
import { ModelsCollection } from '@backend/enums';
import { ComparisonResult } from '@backend/domain/financing';

export type FinancingComparisonDocument = ComparisonResult & Document<ObjectId>;

export const FinancingComparison: Model<FinancingComparisonDocument> =
  buildSchema<FinancingComparisonDocument>(
    ModelsCollection.FINANCIAL_COMPARISON,
    {
      input: {
        location: { type: String, required: true, trim: true },
        installationSizeKwp: { type: Number },
        investmentAmountDt: { type: Number },
      },
      projectCalculation: {
        sizeKwp: { type: Number, required: true },
        capexDt: { type: Number, required: true },
        annualProductionKwh: { type: Number, required: true },
        annualGrossSavingsDt: { type: Number, required: true },
        monthlyGrossSavingsDt: { type: Number, required: true },
        annualOpexDt: { type: Number, required: true },
        monthlyOpexDt: { type: Number, required: true },
      },
      cash: {
        type: { type: String, required: true, enum: ['cash'] },
        initialInvestment: { type: Number, required: true },
        monthlyPayment: { type: Number, required: true },
        monthlyOpex: { type: Number, required: true },
        totalMonthlyCost: { type: Number, required: true },
        monthlyCashflow: { type: Number, required: true },
        durationMonths: { type: Number, required: true },
        durationYears: { type: Number, required: true },
      },
      credit: {
        type: { type: String, required: true, enum: ['credit'] },
        initialInvestment: { type: Number, required: true },
        monthlyPayment: { type: Number, required: true },
        monthlyOpex: { type: Number, required: true },
        totalMonthlyCost: { type: Number, required: true },
        monthlyCashflow: { type: Number, required: true },
        durationMonths: { type: Number, required: true },
        durationYears: { type: Number, required: true },
        creditMonthlyRate: { type: Number, required: true },
        creditAnnualRate: { type: Number, required: true },
        selfFinancingDt: { type: Number, required: true },
        financedPrincipalDt: { type: Number, required: true },
      },
      leasing: {
        type: { type: String, required: true, enum: ['leasing'] },
        initialInvestment: { type: Number, required: true },
        monthlyPayment: { type: Number, required: true },
        monthlyOpex: { type: Number, required: true },
        totalMonthlyCost: { type: Number, required: true },
        monthlyCashflow: { type: Number, required: true },
        durationMonths: { type: Number, required: true },
        durationYears: { type: Number, required: true },
        leasingMonthlyRate: { type: Number, required: true },
        leasingAnnualRate: { type: Number, required: true },
        leasingDownPaymentDt: { type: Number, required: true },
        leasingResidualValueDt: { type: Number, required: true },
        leasingResidualValueRate: { type: Number, required: true },
      },
      esco: {
        type: { type: String, required: true, enum: ['esco'] },
        initialInvestment: { type: Number, required: true },
        monthlyPayment: { type: Number, required: true },
        monthlyOpex: { type: Number, required: true },
        totalMonthlyCost: { type: Number, required: true },
        monthlyCashflow: { type: Number, required: true },
        durationMonths: { type: Number, required: true },
        durationYears: { type: Number, required: true },
        escoTargetIrrMonthly: { type: Number, required: true },
        escoTargetIrrAnnual: { type: Number, required: true },
        escoOpexIncluded: { type: Boolean, required: true },
      },
    },
    {
      timestamps: true,
    }
  );

