/**
 * Validation schemas for financing comparison requests
 */

import Joi from 'joi';

/**
 * Validation schema for comparison request
 */
export const comparisonRequestSchema = Joi.object({
  location: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Location is required',
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location must not exceed 100 characters',
  }),

  installationSizeKwp: Joi.number().positive().optional().messages({
    'number.positive': 'Installation size must be positive',
  }),

  investmentAmountDt: Joi.number().positive().optional().messages({
    'number.positive': 'Investment amount must be positive',
  }),

  creditParams: Joi.object({
    creditAnnualRate: Joi.number().min(0).max(1).optional(),
    selfFinancingRate: Joi.number().min(0).max(1).optional(),
  }).optional(),

  leasingParams: Joi.object({
    leasingAnnualRate: Joi.number().min(0).max(1).optional(),
    leasingResidualValueRate: Joi.number().min(0).max(1).optional(),
    leasingOpexMultiplier: Joi.number().min(1).max(3).optional(),
    selfFinancingRate: Joi.number().min(0).max(1).optional(),
  }).optional(),

  escoParams: Joi.object({
    escoTargetIrrAnnual: Joi.number().min(0).max(1).optional(),
    escoOpexIncluded: Joi.boolean().optional(),
  }).optional(),
})
  .xor('installationSizeKwp', 'investmentAmountDt')
  .messages({
    'object.xor': 'Provide either installationSizeKwp or investmentAmountDt, not both',
    'object.missing':
      'Either installationSizeKwp or investmentAmountDt must be provided',
  });

