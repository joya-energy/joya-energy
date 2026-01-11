/**
 * Solution Card Component
 * Displays a single financing solution
 */

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancingSolution } from '../../services/financing-comparison.service';

@Component({
  selector: 'app-solution-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solution-card.component.html',
  styleUrl: './solution-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolutionCardComponent {
  public solution = input.required<FinancingSolution>();
  public highlighted = input<boolean>(false);

  public getSolutionTitle(type: string): string {
    const titles: Record<string, string> = {
      cash: 'Paiement Comptant',
      credit: 'Crédit Bancaire',
      leasing: 'Leasing',
      esco: 'ESCO JOYA ⭐',
    };
    return titles[type] || type;
  }

  public getSolutionColor(type: string): string {
    const colors: Record<string, string> = {
      cash: '#2196F3',
      credit: '#FF9800',
      leasing: '#9C27B0',
      esco: '#4CAF50',
    };
    return colors[type] || '#666';
  }
}

