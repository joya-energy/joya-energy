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
  lucideSparkles,
  lucidePhone,
  lucideAward,
  lucideXCircle,
} from '@ng-icons/lucide';
import { LeadService, type LeadResponse, type LeadStatus } from '../../core/services/lead.service';

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

/** Status configuration with labels, colors, and icons - matching React design */
export const STATUS_CONFIG: Record<LeadStatus, { label: string; bgColor: string; textColor: string; borderColor: string; icon: string }> = {
  nouveau: { label: 'Nouveau', bgColor: '#dbeafe', textColor: '#1e40af', borderColor: '#bfdbfe', icon: 'lucideSparkles' }, // blue-100/blue-700/blue-200
  contacté: { label: 'Contacté', bgColor: '#fef3c7', textColor: '#b45309', borderColor: '#fde68a', icon: 'lucidePhone' }, // amber-100/amber-700/amber-200
  qualifié: { label: 'Qualifié', bgColor: '#f3e8ff', textColor: '#6b21a8', borderColor: '#e9d5ff', icon: 'lucideCheckCircle2' }, // purple-100/purple-700/purple-200
  converti: { label: 'Converti', bgColor: '#d1fae5', textColor: '#065f46', borderColor: '#a7f3d0', icon: 'lucideAward' }, // emerald-100/emerald-700/emerald-200
  perdu: { label: 'Perdu', bgColor: '#fee2e2', textColor: '#b91c1c', borderColor: '#fecaca', icon: 'lucideXCircle' }, // red-100/red-700/red-200
};

export const STATUS_OPTIONS: LeadStatus[] = ['nouveau', 'contacté', 'qualifié', 'converti', 'perdu'];

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
      lucideSparkles,
      lucidePhone,
      lucideAward,
      lucideXCircle,
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
  readonly updatingStatus = signal<Set<string>>(new Set());

  readonly sourceConfig = SOURCE_CONFIG;
  readonly statusConfig = STATUS_CONFIG;
  readonly statusOptions = STATUS_OPTIONS;

  readonly filteredLeads = computed(() => {
    const q = this.search().toLowerCase().trim();
    const source = this.sourceFilter();
    const status = this.statusFilter();
    const items = this.leads();

    return items.filter((lead) => {
      const matchesSearch =
        !q ||
        (lead.name ?? '').toLowerCase().includes(q) ||
        (lead.email ?? '').toLowerCase().includes(q) ||
        (lead.companyName ?? '').toLowerCase().includes(q);
      const matchesSource =
        source === 'all' || (lead.source ?? '') === source;
      const matchesStatus =
        status === 'all' || (lead.status ?? 'nouveau') === status;
      return matchesSearch && matchesSource && matchesStatus;
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
      qualified: items.filter((l) => l.status === 'qualifié').length,
      converted: items.filter((l) => l.status === 'converti').length,
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

  getStatusLabel(status: LeadStatus | undefined): string {
    const s = status || 'nouveau';
    return STATUS_CONFIG[s]?.label ?? s;
  }

  getStatusBgColor(status: LeadStatus | undefined): string {
    const s = status || 'nouveau';
    return STATUS_CONFIG[s]?.bgColor ?? '#dbeafe';
  }

  getStatusTextColor(status: LeadStatus | undefined): string {
    const s = status || 'nouveau';
    return STATUS_CONFIG[s]?.textColor ?? '#1e40af';
  }

  getStatusBorderColor(status: LeadStatus | undefined): string {
    const s = status || 'nouveau';
    return STATUS_CONFIG[s]?.borderColor ?? '#bfdbfe';
  }

  getStatusIcon(status: LeadStatus | undefined): string {
    const s = status || 'nouveau';
    return STATUS_CONFIG[s]?.icon ?? 'lucideSparkles';
  }

  isUpdatingStatus(leadId: string | undefined): boolean {
    if (!leadId) return false;
    return this.updatingStatus().has(leadId);
  }

  onStatusChange(lead: LeadResponse, newStatus: LeadStatus): void {
    if (!lead.id) return;
    if (lead.status === newStatus) return;

    const leadId = lead.id;
    this.updatingStatus.update((set) => new Set(set).add(leadId));

    this.leadService.updateLeadStatus(leadId, newStatus).subscribe({
      next: (updated) => {
        this.leads.update((leads) =>
          leads.map((l) => (l.id === leadId ? updated : l))
        );
        this.updatingStatus.update((set) => {
          const newSet = new Set(set);
          newSet.delete(leadId);
          return newSet;
        });
      },
      error: (err) => {
        console.error('Failed to update lead status', err);
        this.updatingStatus.update((set) => {
          const newSet = new Set(set);
          newSet.delete(leadId);
          return newSet;
        });
        alert('Erreur lors de la mise à jour du statut');
      },
    });
  }
}
