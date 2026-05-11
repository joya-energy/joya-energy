import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, HostBinding, Input } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';

type ClimateZoneMini = 'nord' | 'centre' | 'sud';
type PreSolarAuditFormValue = { monthlyBillDt: unknown; climateZone: ClimateZoneMini };

@Component({
  selector: 'app-pre-audit-solaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NoGroupingPipe],
  templateUrl: './pre-audit-solaire.component.html',
  styleUrl: './pre-audit-solaire.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreAuditSolaireComponent {
  @Input() embedded = false;

  @HostBinding('class.pre-solar-embedded')
  get isEmbedded(): boolean {
    return this.embedded;
  }

  // Assumptions from the "Pré-Simulateur Solaire Photovoltaïque" doc screenshots.
  private readonly tariffDtPerKwh = 0.391;
  private readonly capexDtPerKwc = 2300;
  private readonly opexRate = 0.04;
  protected readonly maxMonthlyBillDt = 10000;

  private readonly productibleByZone: Record<ClimateZoneMini, number> = {
    nord: 1500,
    centre: 1600,
    sud: 1700,
  };

  private coerceNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const v = Number(value.replace(',', '.'));
      return Number.isFinite(v) ? v : null;
    }
    return null;
  }

  protected readonly form = new FormGroup({
    // Default to half max so the slider starts centered
    monthlyBillDt: new FormControl<number | null>(0, {
      nonNullable: false,
      validators: [Validators.required, Validators.min(0), Validators.max(this.maxMonthlyBillDt)],
    }),
    climateZone: new FormControl<ClimateZoneMini>('centre', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  ) as unknown as () => PreSolarAuditFormValue;

  protected readonly showMonthlyBillError = computed(() => {
    const c = this.form.controls.monthlyBillDt;
    return c.invalid && (c.touched || c.dirty);
  });

  protected readonly selectedZoneLabel = computed(() => {
    const z = this.form.controls.climateZone.value;
    return z === 'nord' ? 'Nord' : z === 'centre' ? 'Centre' : 'Sud';
  });

  protected readonly monthlyBillRoundedForDisplay = computed(() => {
    this.formValue();
    const raw = this.form.getRawValue().monthlyBillDt;
    const v = this.coerceNumber(raw);
    return v == null ? 0 : Math.max(0, Math.min(this.maxMonthlyBillDt, Math.round(v)));
  });

  protected readonly annualBillBeforeRounded = computed(() => {
    this.formValue(); // track reactive form changes
    const monthlyRaw = this.form.getRawValue().monthlyBillDt;
    const monthly = this.coerceNumber(monthlyRaw);
    if (monthly == null) return null;
    return Math.round(monthly * 12);
  });

  protected readonly annualConsumptionKwh = computed(() => {
    this.formValue(); // track reactive form changes
    const monthlyRaw = this.form.getRawValue().monthlyBillDt;
    const monthly = this.coerceNumber(monthlyRaw);
    if (monthly == null || monthly <= 0) return null;
    return (monthly / this.tariffDtPerKwh) * 12;
  });

  protected readonly pvPowerKwc = computed(() => {
    const annualConsumption = this.annualConsumptionKwh();
    if (annualConsumption == null) return null;
    this.formValue(); // track reactive form changes
    const zone = this.form.getRawValue().climateZone;
    const yspec = this.productibleByZone[zone];
    if (!yspec) return null;
    return annualConsumption / yspec;
  });

  protected readonly capexDt = computed(() => {
    const p = this.pvPowerKwc();
    if (p == null) return null;
    return p * this.capexDtPerKwc;
  });

  protected readonly opexAnnualDt = computed(() => {
    const capex = this.capexDt();
    if (capex == null) return null;
    return capex * this.opexRate;
  });

  /**
   * Mini-sim logic: annual savings for year 1.
   * We keep it aligned with the UI equation used elsewhere:
   * Économies = Avant - Après, where "Après" is approximated as 0 DT.
   */
  protected readonly annualSavingsRounded = computed(() => {
    const before = this.annualBillBeforeRounded();
    if (before == null) return null;
    return Math.max(0, before);
  });

  protected readonly annualBillAfterRounded = computed(() => {
    const before = this.annualBillBeforeRounded();
    const savings = this.annualSavingsRounded();
    if (before == null || savings == null) return null;
    return Math.max(0, before - savings);
  });

  protected readonly netAnnualGainRounded = computed(() => {
    const savings = this.annualSavingsRounded();
    const opex = this.opexAnnualDt();
    if (savings == null || opex == null) return null;
    return Math.round(savings - opex);
  });

  protected readonly paybackYearsRounded = computed(() => {
    const capex = this.capexDt();
    const netGain = this.netAnnualGainRounded();
    if (capex == null || netGain == null || netGain <= 0) return null;
    return Math.round((capex / netGain) * 10) / 10;
  });

  protected markMonthlyBillTouched(): void {
    this.form.controls.monthlyBillDt.markAsTouched();
  }
}

