import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ressources-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ressources-page-header.component.html',
  styleUrl: './ressources-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RessourcesPageHeaderComponent {}
