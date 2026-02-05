import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a number without thousand separator (no space or comma every 3 digits).
 * Use instead of the number pipe when grouping is not desired.
 * Format: 'minInt.minFrac-maxFrac' (e.g. '1.0-0', '1.2-2').
 */
@Pipe({ name: 'noGrouping', standalone: true })
export class NoGroupingPipe implements PipeTransform {
  transform(value: number | null | undefined, format: string = '1.0-0'): string {
    if (value == null || !Number.isFinite(value)) {
      return '';
    }
    const parts = format.split(/[.-]/).map((s) => parseInt(s, 10) || 0);
    const minInt = parts[0] ?? 1;
    const minFrac = parts[1] ?? 0;
    const maxFrac = parts[2] ?? minFrac;
    const num = value as number;
    const fixed = maxFrac > 0 ? num.toFixed(maxFrac) : Math.round(num).toString();
    const [intPart, fracPart] = fixed.split('.');
    const paddedInt = intPart.padStart(minInt, '0');
    const result = fracPart != null ? `${paddedInt}.${fracPart}` : paddedInt;
    return result;
  }
}
