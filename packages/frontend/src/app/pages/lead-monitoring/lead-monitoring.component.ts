import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucideClock,
  lucideCheckCircle2,
  lucideTrendingUp,
  lucideUserPlus,
  lucideSearch,
  lucideFilter,
  lucideGlobe,
  lucideEye,
  lucideBarChart3,
  lucideFileText,
  lucideMegaphone,
  lucideHand,
  lucideChevronDown,
  lucideArrowUpRight,
} from '@ng-icons/lucide';
import { LeadService, type LeadResponse } from '../../core/services/lead.service';

/** Display label and icon for API source value */
export const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  'audit-solaire': { label: 'Simulateur', icon: 'lucideBarChart3' },
  'audit-energetique': { label: 'Simulateur', icon: 'lucideBarChart3' },
  'carbon-simulator': { label: 'Simulateur', icon: 'lucideBarChart3' },
  'financing-comparison': { label: 'Simulateur', icon: 'lucideBarChart3' },
  'contact-form': { label: 'Formulaire contact', icon: 'lucideFileText' },
  newsletter: { label: 'Newsletter', icon: 'lucideMegaphone' },
  partenaire: { label: 'Partenaire', icon: 'lucideHand' },
};

/** Status is not in API yet; we show "Nouveau" for all. */
const DEFAULT_STATUS = 'nouveau';

@Component({
  selector: 'app-lead-monitoring',
  standalone: true,
  imports: [DatePipe, RouterLink, NgIconComponent],
  templateUrl: './lead-monitoring.component.html',
  styleUrl: './lead-monitoring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideUsers,
      lucideClock,
      lucideCheckCircle2,
      lucideTrendingUp,
      lucideUserPlus,
      lucideSearch,
      lucideFilter,
      lucideGlobe,
      lucideEye,
      lucideBarChart3,
      lucideFileText,
      lucideMegaphone,
      lucideHand,
      lucideChevronDown,
      lucideArrowUpRight,
    }),
  ],
})
export class LeadMonitoringComponent {
  private readonly leadService = inject(LeadService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly leads = signal<LeadResponse[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal<string>('all');
  readonly sourceFilter = signal<string>('all');

  readonly sourceConfig = SOURCE_CONFIG;

  readonly filteredLeads = computed(() => {
    const q = this.search().toLowerCase().trim();
    const source = this.sourceFilter();
    const items = this.leads();

    return items.filter((lead) => {
      const matchesSearch =
        !q ||
        (lead.name ?? '').toLowerCase().includes(q) ||
        (lead.email ?? '').toLowerCase().includes(q) ||
        (lead.companyName ?? '').toLowerCase().includes(q);
      const matchesSource =
        source === 'all' || (lead.source ?? '') === source;
      return matchesSearch && matchesSource;
    });
  });

  readonly stats = computed(() => {
    const items = this.leads();
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: items.length,
      newToday: items.filter(
        (l) => l.createdAt && l.createdAt.startsWith(today)
      ).length,
      qualified: 0,
      converted: 0,
    };
  });

  readonly sourceOptions = computed(() => {
    const seen = new Set<string>();
    this.leads().forEach((l) => {
      if (l.source) seen.add(l.source);
    });
    return Array.from(seen).sort();
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target?.value ?? '');
  }

  constructor() {
    this.leadService.getLeads().subscribe({
      next: (leads) => {
        this.leads.set(leads);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load leads', err);
        this.error.set(
          err?.message ?? 'Impossible de charger les leads pour le moment.'
        );
        this.isLoading.set(false);
      },
    });
  }

  getSourceLabel(source: string | undefined): string {
    if (!source) return '—';
    return SOURCE_CONFIG[source]?.label ?? source;
  }

  getSourceIcon(source: string | undefined): string {
    if (!source) return 'lucideBarChart3';
    return SOURCE_CONFIG[source]?.icon ?? 'lucideBarChart3';
  }
}
