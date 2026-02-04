import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-politique-donnees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './politique-donnees.component.html',
  styleUrl: './politique-donnees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolitiqueDonneesComponent {
  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
