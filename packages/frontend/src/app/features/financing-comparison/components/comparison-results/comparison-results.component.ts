/**
 * Comparison Results Component
 * Displays all financing solutions in a comparison view
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancingComparisonService } from '../../services/financing-comparison.service';
import { SolutionCardComponent } from '../solution-card/solution-card.component';

@Component({
  selector: 'app-comparison-results',
  standalone: true,
  imports: [CommonModule, SolutionCardComponent],
  templateUrl: './comparison-results.component.html',
  styleUrl: './comparison-results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonResultsComponent {
  private financingService = inject(FinancingComparisonService);

  public result = this.financingService.comparisonResult;
  public solutions = this.financingService.solutions;
  public bestCashflow = this.financingService.bestCashflow;
  public lowestInitialInvestment = this.financingService.lowestInitialInvestment;

  public isBestCashflow(type: string): boolean {
    const best = this.bestCashflow();
    return best?.type === type;
  }
}

