import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBuilding2,
  lucideUtensilsCrossed,
  lucideHotel,
  lucideStethoscope,
  lucideHammer,
  lucideDrumstick,
  lucideBox,
  lucideShirt,
  lucideFactory,
  lucideSnowflake,
} from '@ng-icons/lucide';
import { BilanCarbonFormService } from './bilan-carbon.form.service';
import { CarbonSimulatorService } from '../../core/services/carbon-simulator.service';
import {
  SECTOR_CARD_CONFIG,
  ZONE_OPTIONS,
  GOVERNORATE_OPTIONS,
  TARIFF_OPTIONS,
  MONTH_OPTIONS,
  HEAT_USAGE_OPTIONS,
  HEAT_ENERGY_OPTIONS,
  INTENSITY_OPTIONS,
  AGE_OPTIONS,
  MAINTENANCE_OPTIONS,
  FUEL_OPTIONS,
  VEHICLE_USAGE_OPTIONS,
  TRAVEL_FREQUENCY_OPTIONS,
} from './bilan-carbon.types';
import type { CarbonFootprintSummaryResult } from '../../core/services/carbon-simulator.service';

@Component({
  selector: 'app-bilan-carbon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  templateUrl: './bilan-carbon.component.html',
  styleUrl: './bilan-carbon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideBuilding2,
      lucideUtensilsCrossed,
      lucideHotel,
      lucideStethoscope,
      lucideHammer,
      lucideDrumstick,
      lucideBox,
      lucideShirt,
      lucideFactory,
      lucideSnowflake,
    }),
  ],
})
export class BilanCarbonComponent {
  private formService = inject(BilanCarbonFormService);
  private carbonService = inject(CarbonSimulatorService);

  protected form = this.formService.buildForm();
  protected result = signal<CarbonFootprintSummaryResult | null>(null);
  protected loading = signal(false);
  protected submitError = signal<string | null>(null);

  protected readonly sectorCards = SECTOR_CARD_CONFIG;
  protected readonly zoneOptions = ZONE_OPTIONS;
  protected readonly governorateOptions = GOVERNORATE_OPTIONS;
  protected readonly tariffOptions = TARIFF_OPTIONS;
  protected readonly monthOptions = MONTH_OPTIONS;
  protected readonly heatUsageOptions = HEAT_USAGE_OPTIONS;
  protected readonly heatEnergyOptions = HEAT_ENERGY_OPTIONS;
  protected readonly intensityOptions = INTENSITY_OPTIONS;
  protected readonly ageOptions = AGE_OPTIONS;
  protected readonly maintenanceOptions = MAINTENANCE_OPTIONS;
  protected readonly fuelOptions = FUEL_OPTIONS;
  protected readonly vehicleUsageOptions = VEHICLE_USAGE_OPTIONS;
  protected readonly travelFrequencyOptions = TRAVEL_FREQUENCY_OPTIONS;

  protected selectSector(id: string): void {
    this.form.controls.general.controls.sector.setValue(id);
  }

  protected submit(): void {
    this.submitError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const payload = this.buildPayload();
    this.loading.set(true);
    this.carbonService.calculateSummary(payload).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.submitError.set(err?.error?.message ?? 'Erreur lors du calcul. Veuillez réessayer.');
        this.loading.set(false);
      },
    });
  }

  protected reset(): void {
    this.result.set(null);
    this.submitError.set(null);
    this.form.reset(this.formService.buildForm().value);
  }

  private buildPayload(): Parameters<CarbonSimulatorService['calculateSummary']>[0] {
    const g = this.form.controls.general.getRawValue();
    const e = this.form.controls.electricity.getRawValue();
    const h = this.form.controls.heat.getRawValue();
    const c = this.form.controls.cold.getRawValue();
    const v = this.form.controls.vehicles.getRawValue();
    const t = this.form.controls.travel.getRawValue();
    const it = this.form.controls.itEquipment.getRawValue();

    const sector = g.sector ?? '';
    const zone = g.zone ?? 'Centre';
    const surfaceM2 = g.surfaceM2 ?? 0;

    return {
      electricity: {
        monthlyAmountDt: e.monthlyBillAmountDt ?? 0,
        referenceMonth: e.referenceMonth ?? 6,
        buildingType: sector as never,
        climateZone: zone as 'Nord' | 'Centre' | 'Sud',
        tariffType: (e.tariffType ?? 'BT') as 'BT' | 'MT_UNIFORME' | 'MT_HORAIRE',
      },
      thermal: {
        hasHeatUsages: h.hasHeatUsages ?? false,
        annualElectricityKwh: 0, // backend fills from electricity result
        buildingType: sector as never,
        selectedHeatUsages: (h.selectedHeatUsage ? [h.selectedHeatUsage] : []) as ('DOMESTIC_HOT_WATER' | 'COOKING_KITCHEN' | 'INDUSTRIAL_PROCESS' | 'SPACE_HEATING')[],
        selectedHeatEnergies: (h.selectedHeatEnergy ? [h.selectedHeatEnergy] : []) as ('NATURAL_GAS' | 'DIESEL_FUEL' | 'LPG' | 'UNKNOWN')[],
      },
      cold: {
        hasCold: c.hasCold ?? false,
        surfaceM2,
        buildingType: sector as never,
        intensityLevel: (c.intensity ?? 'Modérée') as 'Faible' | 'Modérée' | 'Élevée',
        equipmentAge: (c.equipmentAge ?? '3-7 ans') as '<3 ans' | '3-7 ans' | '>7 ans' | 'NSP',
        maintenanceStatus: (c.maintenance ?? 'NSP') as 'Oui' | 'Non' | 'NSP',
      },
      vehicles: {
        hasVehicles: v.hasVehicles ?? false,
        numberOfVehicles: v.numberOfVehicles ?? 0,
        kmPerVehiclePerYear: v.kmPerVehiclePerYear ?? 0,
        usageType: (v.usageType ?? 'Déplacements légers') as never,
        fuelType: (v.fuelType ?? 'Diesel') as never,
      },
      scope3: {
        travel: {
          planeFrequency: t.planeFrequency ?? undefined,
          trainFrequency: t.trainFrequency ?? undefined,
        },
        itEquipment: {
          laptopCount: it.laptopCount ?? 0,
          desktopCount: it.desktopCount ?? 0,
          screenCount: it.screenCount ?? 0,
          proPhoneCount: it.proPhoneCount ?? 0,
        },
      },
    };
  }
}
