import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class LogoComponent {
  // Inputs
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly showText = input<boolean>(true);
  readonly href = input<string>('/');
}

