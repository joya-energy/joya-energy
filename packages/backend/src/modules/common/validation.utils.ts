import { HTTP400Error } from '@backend/errors/http.error';

type NumberConstraints = {
  min?: number;
  max?: number;
  integer?: boolean;
};

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new HTTP400Error(`Field "${field}" must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    throw new HTTP400Error(`Field "${field}" cannot be empty`);
  }
  return trimmed;
}

export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireString(value, field);
}

export function requireNumber(value: unknown, field: string, constraints?: NumberConstraints): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new HTTP400Error(`Field "${field}" must be a valid number`);
  }
  if (constraints?.integer && !Number.isInteger(numeric)) {
    throw new HTTP400Error(`Field "${field}" must be an integer`);
  }
  if (constraints?.min !== undefined && numeric < constraints.min) {
    throw new HTTP400Error(`Field "${field}" must be greater than or equal to ${constraints.min}`);
  }
  if (constraints?.max !== undefined && numeric > constraints.max) {
    throw new HTTP400Error(`Field "${field}" must be less than or equal to ${constraints.max}`);
  }
  return numeric;
}

export function optionalNumber(
  value: unknown,
  field: string,
  constraints?: NumberConstraints
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireNumber(value, field, constraints);
}

export function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  throw new HTTP400Error(`Field "${field}" must be a boolean`);
}

export function requireEnum<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown,
  field: string
): T[keyof T] {
  const candidate = requireString(value, field);
  const match = (Object.values(enumObj) as Array<string | number>).find((enumValue) => {
    return String(enumValue) === candidate;
  });
  if (!match) {
    throw new HTTP400Error(`Field "${field}" has an invalid value`);
  }
  return match as T[keyof T];
}

export function enumArray<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown,
  field: string
): Array<T[keyof T]> {
  if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
    return [];
  }
  const rawValues = Array.isArray(value) ? value : [value];
  return rawValues
    .filter((entry) => entry !== undefined && entry !== null && String(entry).trim().length > 0)
    .map((entry) => requireEnum(enumObj, entry, field));
}

export function requireEmail(value: unknown, field: string): string {
  const email = requireString(value, field);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new HTTP400Error(`Field "${field}" must be a valid email address`);
  }
  return email;
}

export function optionalUrl(value: unknown, field: string): string | undefined {
  const url = optionalString(value, field);
  if (!url) {
    return undefined;
  }
  try {
    new URL(url);
    return url;
  } catch {
    throw new HTTP400Error(`Field "${field}" must be a valid URL`);
  }
}

