/**
 * Financing Input Form Component
 * Collects user input for financing comparison
 */

import { Component, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancingComparisonService, ProjectInput } from '../../services/financing-comparison.service';
import { Governorates } from '@shared/enums/audit-general.enum';

@Component({
  selector: 'app-financing-input-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financing-input-form.component.html',
  styleUrl: './financing-input-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancingInputFormComponent {
  private financingService = inject(FinancingComparisonService);

  public compareClicked = output<ProjectInput>();

  public location = signal<Governorates | ''>('');
  public inputType = signal<'size' | 'amount'>('size');
  public installationSize = signal<number | null>(null);
  public investmentAmount = signal<number | null>(null);

  public locations = this.financingService.locations;
  public loading = this.financingService.loading;
  public error = this.financingService.error;

  public isValid = signal<boolean>(false);

  constructor() {
    this.financingService.fetchLocations().subscribe();
  }

  public onInputTypeChange(type: 'size' | 'amount'): void {
    this.inputType.set(type);
    this.installationSize.set(null);
    this.investmentAmount.set(null);
    this.validateForm();
  }

  public onLocationChange(location: string): void {
    this.location.set(location as Governorates);
    this.validateForm();
  }

  public onInstallationSizeChange(value: number | null): void {
    this.installationSize.set(value);
    this.validateForm();
  }

  public onInvestmentAmountChange(value: number | null): void {
    this.investmentAmount.set(value);
    this.validateForm();
  }

  public onSubmit(): void {
    if (!this.isValid()) return;

    const input: ProjectInput = {
      location: this.location() as Governorates,
    };

    if (this.inputType() === 'size' && this.installationSize()) {
      input.installationSizeKwp = this.installationSize()!;
    } else if (this.inputType() === 'amount' && this.investmentAmount()) {
      input.investmentAmountDt = this.investmentAmount()!;
    }

    this.compareClicked.emit(input);
  }

  private validateForm(): void {
    const hasLocation = this.location().length > 0;
    const hasValidSize = this.inputType() === 'size' && this.installationSize() !== null && this.installationSize()! > 0;
    const hasValidAmount = this.inputType() === 'amount' && this.investmentAmount() !== null && this.investmentAmount()! > 0;

    this.isValid.set(hasLocation && (hasValidSize || hasValidAmount));
  }
}

