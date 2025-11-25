import { type IncomingHttpHeaders } from 'http';
import { DateTime } from 'luxon';

export function isValidDateFormat(d: unknown): false | boolean {
  if (!Number.isNaN(+(d as string))) {
    return false;
  }
  const allowedCustomDateFormats = ['dd/MM/yyyy', 'MM/dd/yyyy'];
  return DateTime.fromISO(d as string).isValid || allowedCustomDateFormats.some((fmt) => DateTime.fromFormat(d as string, fmt).isValid);
}

function toUtcDate(strDate: string): Date {
  return DateTime.fromISO(strDate, { zone: 'utc' }).toJSDate();
}

function reviver<T>(_key: string, value: T): T | boolean | string | Date {
  if (typeof value === 'string') {
    switch (value) {
      case 'false':
        return false;
      case 'true':
        return true;
      default:
        if (isValidDateFormat(value)) {
          // We are offsetting date to UTC to avoid conversion issues
          return toUtcDate(value);
        }
        break;
    }
  }
  return value;
}

export function parseJSON<T>(json: Record<string, string>): T {
  return JSON.parse(JSON.stringify(json), reviver);
}

export function parseAggregationToJSON<T>(json: Record<string, any>): T {
  return JSON.parse(JSON.stringify(json), reviver);
}

export function getRequestJwtToken(headers: IncomingHttpHeaders): string {
  const authHeader = headers.authorization?.split(' ');
  const [, token] = authHeader ?? [];
  return token;
}
