/**
 * Financing Comparison Page Component
 * Main container for financing comparison feature
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancingComparisonService, ProjectInput } from './services/financing-comparison.service';
import { FinancingInputFormComponent } from './components/financing-input-form/financing-input-form.component';
import { ComparisonResultsComponent } from './components/comparison-results/comparison-results.component';

@Component({
  selector: 'app-financing-comparison',
  standalone: true,
  imports: [
    CommonModule,
    FinancingInputFormComponent,
    ComparisonResultsComponent,
  ],
  template: `
    <div class="financing-comparison-page">
      <div class="container">
        @if (!hasResult()) {
          <app-financing-input-form 
            (compareClicked)="onCompare($event)" />
        } @else {
          <button class="btn-back" (click)="onReset()">
            ← Nouvelle comparaison
          </button>
          <app-comparison-results />
        }
      </div>
    </div>
  `,
  styles: [`
    .financing-comparison-page {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 2rem 0;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .btn-back {
      margin-bottom: 2rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #4CAF50;
      color: #4CAF50;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-back:hover {
      background: #4CAF50;
      color: white;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancingComparisonComponent {
  private financingService = inject(FinancingComparisonService);

  public hasResult = this.financingService.hasResult;

  public onCompare(input: ProjectInput): void {
    this.financingService.createComparison(input).subscribe();
  }

  public onReset(): void {
    this.financingService.clearResult();
  }
}

