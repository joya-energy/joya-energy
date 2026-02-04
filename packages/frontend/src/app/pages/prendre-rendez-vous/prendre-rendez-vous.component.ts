import { Component, ChangeDetectionStrategy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

const CALENDLY_SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';

@Component({
  selector: 'app-prendre-rendez-vous',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './prendre-rendez-vous.component.html',
  styleUrl: './prendre-rendez-vous.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrendreRendezVousComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Avoid loading the Calendly script multiple times
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_SCRIPT_SRC}"]`
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = CALENDLY_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }
}
