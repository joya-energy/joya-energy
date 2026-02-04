import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideBox,
  lucideDrumstick,
  lucideFactory,
  lucideGraduationCap,
  lucideHammer,
  lucideHotel,
  lucidePill,
  lucideSnowflake,
  lucideSparkles,
  lucideStethoscope,
  lucideBuilding2,
  lucideShirt,
  lucideUtensilsCrossed
} from '@ng-icons/lucide';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent, SelectOption } from '../../../../shared/components/ui-select/ui-select.component';
import { BuildingCardConfig } from '../../../../shared/icons/audit-building-icons';

@Component({
  selector: 'app-step-building',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    UiInputComponent,
    UiSelectComponent
  ],
  templateUrl: './step-building.component.html',
  styleUrls: ['./step-building.component.scss'],
  providers: [
    provideIcons({
      lucideBox,
      lucideDrumstick,
      lucideFactory,
      lucideGraduationCap,
      lucideHammer,
      lucideHotel,
      lucidePill,
      lucideSnowflake,
      lucideSparkles,
      lucideStethoscope,
      lucideBuilding2,
      lucideShirt,
      lucideUtensilsCrossed
    })
  ]
})
export class StepBuildingComponent {
  @Input() form!: FormGroup;
  @Input() buildingCategories: BuildingCardConfig[] = [];
  @Input() buildingTypes: readonly string[] = [];
  @Input() activityTypes: readonly string[] = [];
  @Input() climateZones: readonly string[] = [];

  selectBuildingType(type: string): void {
    this.form.get('buildingType')?.setValue(type);
  }

  isFeaturedBuilding(type: string | null): boolean {
    if (!type) return true;
    return this.buildingCategories.some(cat => cat.id === type);
  }

  trackByCategory(_: number, category: BuildingCardConfig): string {
    return category.id;
  }

  getBuildingTypeOptions(): SelectOption[] {
    return this.buildingTypes.map(opt => ({
      label: opt,
      value: opt
    }));
  }

  getActivityTypeOptions(): SelectOption[] {
    return this.activityTypes.map(opt => ({
      label: opt,
      value: opt
    }));
  }

  getClimateZoneOptions(): SelectOption[] {
    return this.climateZones.map(opt => ({
      label: opt,
      value: opt
    }));
  }
}
