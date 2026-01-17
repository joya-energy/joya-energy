import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-solar-simulator-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solar-simulator-section.component.html',
  styleUrl: './solar-simulator-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolarSimulatorSectionComponent {
  protected readonly label = 'ESTIMATION SOLAIRE';
  protected readonly title = 'Estimez votre potentiel solaire';
  protected readonly subtitle = 'Découvrez en quelques clics combien vous pourriez économiser avec notre solution de financement solaire.';
  
  protected readonly address = signal('');
  protected readonly energyBill = signal('');
  
  protected estimatePotential(): void {
    // Redirect to audit solaire page with params
    const params = new URLSearchParams({
      address: this.address(),
      bill: this.energyBill()
    });
    window.location.href = `/audit-solaire?${params.toString()}`;
  }
}


