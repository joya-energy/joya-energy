/**
 * Comparison Results Component
 * Displays all financing solutions in a comparison view
 */

import { Component, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoGroupingPipe } from '../../../../shared/pipes/no-grouping.pipe';
import { FinancingComparisonService, EscoSolution } from '../../services/financing-comparison.service';
import { SolutionCardComponent } from '../solution-card/solution-card.component';
import { NotificationStore } from '../../../../core/notifications/notification.store';

@Component({
  selector: 'app-comparison-results',
  standalone: true,
  imports: [CommonModule, NoGroupingPipe, SolutionCardComponent],
  templateUrl: './comparison-results.component.html',
  styleUrl: './comparison-results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonResultsComponent {
  private financingService = inject(FinancingComparisonService);
  private notificationStore = inject(NotificationStore);

  public result = this.financingService.comparisonResult;
  public solutions = this.financingService.solutions;
  public bestCashflow = this.financingService.bestCashflow;
  public lowestInitialInvestment = this.financingService.lowestInitialInvestment;

  constructor() {
    effect(() => {
      const result = this.result();
      if (result?.esco && !result.esco.isViable && result.esco.viabilityError) {
        this.notificationStore.addNotification({
          type: 'warning',
          title: 'Solution ESCO non viable',
          message: result.esco.viabilityError,
          duration: 8000
        });
      }
    });
  }

  public isBestCashflow(type: string): boolean {
    const best = this.bestCashflow();
    return best?.type === type;
  }
}

