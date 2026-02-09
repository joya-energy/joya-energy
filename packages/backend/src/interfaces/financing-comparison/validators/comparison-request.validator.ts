/**
 * Validation functions for financing comparison requests
 */

import { Governorates } from '@shared/enums/audit-general.enum';
import { HTTP400Error } from '@backend/errors/http.error';
import {
  requireEnum,
  optionalNumber,
} from '@backend/modules/common/validation.utils';

function optionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

/**
 * Validate comparison request data
 */
export function validateComparisonRequest(data: unknown): {
  location: Governorates;
  installationSizeKwp?: number;
  investmentAmountDt?: number;
  fullName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  creditParams?: {
    creditAnnualRate?: number;
    selfFinancingRate?: number;
  };
  leasingParams?: {
    leasingAnnualRate?: number;
    leasingResidualValueRate?: number;
    leasingOpexMultiplier?: number;
    selfFinancingRate?: number;
  };
  escoParams?: {
    escoTargetIrrAnnual?: number;
    escoOpexIncluded?: boolean;
  };
} {
  if (!data || typeof data !== 'object') {
    throw new HTTP400Error('Request body must be an object');
  }

  const body = data as Record<string, unknown>;

  // Validate location
  const location = requireEnum(Governorates, body.location, 'location');

  // Validate installation size and investment amount (XOR logic)
  const installationSizeKwp = optionalNumber(
    body.installationSizeKwp,
    'installationSizeKwp'
  );
  const investmentAmountDt = optionalNumber(
    body.investmentAmountDt,
    'investmentAmountDt'
  );

  if (!installationSizeKwp && !investmentAmountDt) {
    throw new HTTP400Error(
      'Either installationSizeKwp or investmentAmountDt must be provided'
    );
  }

  if (installationSizeKwp && investmentAmountDt) {
    throw new HTTP400Error(
      'Provide either installationSizeKwp or investmentAmountDt, not both'
    );
  }

  if (installationSizeKwp !== undefined && installationSizeKwp <= 0) {
    throw new HTTP400Error('Installation size must be positive');
  }

  if (investmentAmountDt !== undefined && investmentAmountDt <= 0) {
    throw new HTTP400Error('Investment amount must be positive');
  }

  // Optional contact (for sending results by email)
  const fullName = optionalString(body.fullName);
  const companyName = optionalString(body.companyName);
  const email = optionalString(body.email);
  const phoneNumber = optionalString(body.phoneNumber);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HTTP400Error('Invalid email format');
  }

  const result: {
    location: Governorates;
    installationSizeKwp?: number;
    investmentAmountDt?: number;
    fullName?: string;
    companyName?: string;
    email?: string;
    phoneNumber?: string;
    creditParams?: {
      creditAnnualRate?: number;
      selfFinancingRate?: number;
    };
    leasingParams?: {
      leasingAnnualRate?: number;
      leasingResidualValueRate?: number;
      leasingOpexMultiplier?: number;
      selfFinancingRate?: number;
    };
    escoParams?: {
      escoTargetIrrAnnual?: number;
      escoOpexIncluded?: boolean;
    };
  } = {
    location,
    installationSizeKwp,
    investmentAmountDt,
    fullName,
    companyName,
    email,
    phoneNumber,
  };

  // Validate credit params
  if (body.creditParams) {
    const creditParams = body.creditParams as Record<string, unknown>;
    result.creditParams = {
      creditAnnualRate: optionalNumber(
        creditParams.creditAnnualRate,
        'creditAnnualRate'
      ),
      selfFinancingRate: optionalNumber(
        creditParams.selfFinancingRate,
        'selfFinancingRate'
      ),
    };

    if (
      result.creditParams.creditAnnualRate !== undefined &&
      (result.creditParams.creditAnnualRate < 0 ||
        result.creditParams.creditAnnualRate > 1)
    ) {
      throw new HTTP400Error('Credit annual rate must be between 0 and 1');
    }

    if (
      result.creditParams.selfFinancingRate !== undefined &&
      (result.creditParams.selfFinancingRate < 0 ||
        result.creditParams.selfFinancingRate > 1)
    ) {
      throw new HTTP400Error(
        'Credit self-financing rate must be between 0 and 1'
      );
    }
  }

  // Validate leasing params
  if (body.leasingParams) {
    const leasingParams = body.leasingParams as Record<string, unknown>;
    result.leasingParams = {
      leasingAnnualRate: optionalNumber(
        leasingParams.leasingAnnualRate,
        'leasingAnnualRate'
      ),
      leasingResidualValueRate: optionalNumber(
        leasingParams.leasingResidualValueRate,
        'leasingResidualValueRate'
      ),
      leasingOpexMultiplier: optionalNumber(
        leasingParams.leasingOpexMultiplier,
        'leasingOpexMultiplier'
      ),
      selfFinancingRate: optionalNumber(
        leasingParams.selfFinancingRate,
        'selfFinancingRate'
      ),
    };

    if (
      result.leasingParams.leasingAnnualRate !== undefined &&
      (result.leasingParams.leasingAnnualRate < 0 ||
        result.leasingParams.leasingAnnualRate > 1)
    ) {
      throw new HTTP400Error('Leasing annual rate must be between 0 and 1');
    }

    if (
      result.leasingParams.leasingResidualValueRate !== undefined &&
      (result.leasingParams.leasingResidualValueRate < 0 ||
        result.leasingParams.leasingResidualValueRate > 1)
    ) {
      throw new HTTP400Error(
        'Leasing residual value rate must be between 0 and 1'
      );
    }

    if (
      result.leasingParams.leasingOpexMultiplier !== undefined &&
      (result.leasingParams.leasingOpexMultiplier < 1 ||
        result.leasingParams.leasingOpexMultiplier > 3)
    ) {
      throw new HTTP400Error('Leasing OPEX multiplier must be between 1 and 3');
    }

    if (
      result.leasingParams.selfFinancingRate !== undefined &&
      (result.leasingParams.selfFinancingRate < 0 ||
        result.leasingParams.selfFinancingRate > 1)
    ) {
      throw new HTTP400Error(
        'Leasing self-financing rate must be between 0 and 1'
      );
    }
  }

  // Validate ESCO params
  if (body.escoParams) {
    const escoParams = body.escoParams as Record<string, unknown>;
    result.escoParams = {
      escoTargetIrrAnnual: optionalNumber(
        escoParams.escoTargetIrrAnnual,
        'escoTargetIrrAnnual'
      ),
      escoOpexIncluded:
        typeof escoParams.escoOpexIncluded === 'boolean'
          ? escoParams.escoOpexIncluded
          : undefined,
    };

    if (
      result.escoParams.escoTargetIrrAnnual !== undefined &&
      (result.escoParams.escoTargetIrrAnnual < 0 ||
        result.escoParams.escoTargetIrrAnnual > 1)
    ) {
      throw new HTTP400Error('ESCO target IRR must be between 0 and 1');
    }
  }

  return result;
}
