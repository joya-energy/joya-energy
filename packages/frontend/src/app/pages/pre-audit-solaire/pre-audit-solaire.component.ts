import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { NoGroupingPipe } from '../../shared/pipes/no-grouping.pipe';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';

type ClimateZoneMini = 'nord' | 'centre' | 'sud';
type PreSolarAuditFormValue = { monthlyBillDt: unknown; climateZone: ClimateZoneMini };

@Component({
  selector: 'app-pre-audit-solaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NoGroupingPipe],
  templateUrl: './pre-audit-solaire.component.html',
  styleUrl: './pre-audit-solaire.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pre-solar-embedded]': 'embedded',
  },
})
export class PreAuditSolaireComponent implements AfterViewInit {
  @Input() embedded = false;
  private readonly motion = inject(HandoffMotionService);

  // STEG BT unitaire TTC (TVA 19 %): 0.391 × 1.19 = 0.465 DT/kWh
  private readonly tariffDtPerKwh = 0.465;
  private readonly capexDtPerKwc = 2400;
  private readonly opexRate = 0.04;
  protected readonly minMonthlyBillDt = 100;
  protected readonly maxMonthlyBillDt = 3000;

  private readonly productibleByZone: Record<ClimateZoneMini, number> = {
    nord: 1500,
    centre: 1600,
    sud: 1700,
  };

  private coerceNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  protected readonly form = new FormGroup({
    monthlyBillDt: new FormControl<number | null>(800, {
      nonNullable: false,
      validators: [
        Validators.required,
        Validators.min(this.minMonthlyBillDt),
        Validators.max(this.maxMonthlyBillDt),
      ],
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

  protected readonly monthlyBillRoundedForDisplay = computed(() => {
    this.formValue();
    const raw = this.form.getRawValue().monthlyBillDt;
    const value = this.coerceNumber(raw);
    if (value == null) return this.minMonthlyBillDt;
    return Math.max(
      this.minMonthlyBillDt,
      Math.min(this.maxMonthlyBillDt, Math.round(value))
    );
  });

  protected readonly sliderFillPercent = computed(() => {
    const bill = this.monthlyBillRoundedForDisplay();
    const span = this.maxMonthlyBillDt - this.minMonthlyBillDt;
    if (span <= 0) return 0;
    return ((bill - this.minMonthlyBillDt) / span) * 100;
  });

  protected readonly annualBillBeforeRounded = computed(() => {
    this.formValue();
    const monthly = this.coerceNumber(this.form.getRawValue().monthlyBillDt);
    if (monthly == null) return null;
    return Math.round(monthly * 12);
  });

  protected readonly annualConsumptionKwh = computed(() => {
    this.formValue();
    const monthly = this.coerceNumber(this.form.getRawValue().monthlyBillDt);
    if (monthly == null || monthly <= 0) return null;
    return (monthly / this.tariffDtPerKwh) * 12;
  });

  protected readonly pvPowerKwc = computed(() => {
    const annualConsumption = this.annualConsumptionKwh();
    if (annualConsumption == null) return null;
    this.formValue();
    const zone = this.form.getRawValue().climateZone;
    const yspec = this.productibleByZone[zone];
    if (!yspec) return null;
    return annualConsumption / yspec;
  });

  protected readonly capexDt = computed(() => {
    const power = this.pvPowerKwc();
    if (power == null) return null;
    return power * this.capexDtPerKwc;
  });

  protected readonly opexAnnualDt = computed(() => {
    const capex = this.capexDt();
    if (capex == null) return null;
    return capex * this.opexRate;
  });

  /**
   * Mini-sim: annual savings for year 1.
   * Aligned with existing landing formula (Avant − Après ≈ full annual bill).
   */
  protected readonly annualSavingsRounded = computed(() => {
    const before = this.annualBillBeforeRounded();
    if (before == null) return null;
    return Math.max(0, before);
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

  protected setZone(zone: ClimateZoneMini): void {
    this.form.controls.climateZone.setValue(zone);
  }

  protected markMonthlyBillTouched(): void {
    this.form.controls.monthlyBillDt.markAsTouched();
  }

  ngAfterViewInit(): void {
    if (!this.embedded) {
      this.motion.refresh();
    }
  }
}
