import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FooterVisibilityService } from './shared/services/footer-visibility.service';
import { HandoffMotionService } from './core/services/handoff-motion.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    NotificationToastComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('joya-frontend');
  protected readonly footerVisibility = inject(FooterVisibilityService);
  private readonly motion = inject(HandoffMotionService);

  ngOnInit(): void {
    this.motion.start();
  }
}
