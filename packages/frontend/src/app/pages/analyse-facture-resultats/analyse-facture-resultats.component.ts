import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideArrowUpRight,
  lucideCheck,
  lucideFlame,
  lucideInfo,
  lucidePlus,
  lucideZap,
} from '@ng-icons/lucide';
import { UiProgressBarComponent } from '../../shared/components/ui-progress-bar/ui-progress-bar.component';
import { UiStepTimelineComponent } from '../../shared/components/ui-step-timeline/ui-step-timeline.component';
import { SEOService } from '../../core/services/seo.service';
import { AnalyseFactureStore } from '../../core/stores/analyse-facture.store';
import { MOCK_BT_RESULT, MOCK_MT_RESULT } from './analyse-facture-resultats.mock';
import type {
  AffichageField,
  BtAnalyseResult,
  DetailFactureRow,
  MtAnalyseResult,
  MtRatioProfile,
  MtSituationView,
  TariffType,
  VanChartData,
} from './analyse-facture-resultats.types';

interface BillAnalysisFlowStep {
  number: number;
  title: string;
  isResult?: boolean;
}

const BILL_ANALYSIS_FLOW_STEPS: BillAnalysisFlowStep[] = [
  { number: 1, title: 'Facture' },
  { number: 2, title: 'Informations personnelles' },
  { number: 3, title: 'Résultats', isResult: true },
];

const BT_FIELD_TIPS: Record<string, string> = {
  periode_facturation: "Période durant laquelle l'électricité a été consommée et facturée.",
  puissance_souscrite_kva:
    "Capacité maximale d'électricité réservée auprès de la STEG pour alimenter votre installation.",
  consommation_totale_kwh: "Quantité totale d'électricité utilisée pendant la période facturée.",
  prix_unitaire: "Prix payé pour chaque unité d'électricité consommée.",
  redevances_fixes:
    'Frais fixes liés à votre abonnement et au maintien de votre raccordement au réseau électrique.',
  montant_a_payer:
    "Montant final à régler à la STEG, incluant la consommation, l'abonnement et les taxes.",
  montant_total:
    "Montant total incluant la consommation, l'abonnement et l'ensemble des taxes appliquées par la STEG.",
};

const MT_FIELD_TIPS: Record<string, string> = {
  mois_facturation: "Mois et année de la facture permettant d'identifier la période concernée.",
  puissance_souscrite_kva:
    "Capacité maximale d'électricité réservée auprès de la STEG pour votre installation.",
  puissance_maximale_appelee_kw:
    'Puissance la plus élevée utilisée pendant la période facturée.',
  puissance_installee_kva:
    'Puissance totale que peuvent utiliser vos équipements lorsqu\'ils fonctionnent simultanément.',
  depassement_puissance_kw:
    'Puissance utilisée au-delà de la limite prévue dans votre contrat.',
  consommation_totale_kwh:
    "Quantité totale d'électricité utilisée pendant la période facturée.",
  energie_reactive_kvarh:
    'Énergie utilisée par certains équipements tels que les moteurs et transformateurs.',
  cos_phi: "Indicateur de la qualité d'utilisation de l'électricité par votre installation.",
  coefficient_k:
    'Coefficient de réduction ou majoration appliqué au montant de l\'énergie active selon le cos φ. Formule : (cos φ − 0.90) × 0.5 si cos φ > 0.90.',
  prime_puissance: 'Montant lié à la puissance réservée auprès de la STEG.',
  bonification_cos_phi:
    'Réduction accordée lorsque votre installation utilise efficacement l\'électricité.',
  penalite_cos_phi:
    'Montant supplémentaire appliqué lorsque votre installation utilise moins efficacement l\'électricité.',
  prix_energie: "Prix appliqué à l'électricité consommée.",
  montant_energie: "Coût total de l'électricité consommée.",
  montant_net_a_payer: 'Montant final à payer à la STEG.',
};

@Component({
  selector: 'app-analyse-facture-resultats',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent, UiProgressBarComponent, UiStepTimelineComponent],
  templateUrl: './analyse-facture-resultats.component.html',
  styleUrl: './analyse-facture-resultats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideArrowUpRight,
      lucideCheck,
      lucideFlame,
      lucideInfo,
      lucidePlus,
      lucideZap,
    }),
  ],
})
export class AnalyseFactureResultatsComponent implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly analyseFactureStore = inject(AnalyseFactureStore);

  protected readonly steps = BILL_ANALYSIS_FLOW_STEPS;
  protected readonly currentStep = signal(3);
  protected readonly overallProgress = 100;

  protected readonly stepProgress = (): Record<number, number> => ({
    1: 100,
    2: 100,
    3: 0,
  });

  protected readonly tariffType = signal<TariffType>('BT');

  protected readonly btResult = signal<BtAnalyseResult | null>(null);
  protected readonly mtResult = signal<MtAnalyseResult | null>(null);

  protected readonly facture = computed(() => this.btResult()!.facture_extraite);

  protected readonly clientName = computed(() => this.facture().client);

  protected readonly situationBadge = computed(() => {
    const period = this.facture().periode_facturation === '1' ? 'MENSUELLE' : 'PÉRIODE';
    return `VOTRE SITUATION — ${period}`;
  });

  protected readonly periodSummary = computed(() => {
    const f = this.facture();
    const debut = this.formatDateFr(f.date_debut_periode);
    const fin = this.formatDateFr(f.date_fin_periode);
    return `Période ${debut} → ${fin}.`;
  });

  protected readonly montantEnergie = computed(() =>
    this.formatAmount(this.facture().montant_energie)
  );

  protected readonly montantAPayer = computed(() =>
    this.formatAmount(this.facture().montant_a_payer || this.facture().montant_total)
  );

  protected readonly gazBannerText = computed(() => {
    const gaz = this.facture().gaz;
    if (!gaz || gaz.presence_gaz !== 'Oui') return null;
    const m3 = this.formatNumber(gaz.consommation_gaz_m3 ?? '0');
    const montant = this.formatAmount(gaz.montant_energie_gaz ?? '0');
    return `Gaz naturel inclus : ${m3} m³ consommés, pour ${montant} DT d'énergie gaz sur cette facture.`;
  });

  protected readonly showBtMtRevision = computed(() => {
    const kva = Number(this.facture().puissance_souscrite_kva);
    const etude = this.btResult()?.etude_bt_mt;
    if (!etude || kva <= 100) {
      return false;
    }
    const economie = Number(etude.economie_annuelle_dt);
    return Number.isFinite(economie) && economie > 0;
  });

  /** @deprecated alias — use showBtMtRevision */
  protected showEtudeBtMt(): boolean {
    return this.showBtMtRevision();
  }

  protected readonly puissanceAlertText = computed(() => {
    if (!this.showBtMtRevision()) return null;
    const kva = this.formatNumber(this.facture().puissance_souscrite_kva);
    const prixBt = this.facture().prix_unitaire;
    const prixMt = this.btResult()?.etude_bt_mt?.prix_unitaire_kwh ?? '0.291';
    return `votre puissance souscrite de ${kva} kVA dépasse le seuil de 100 kVA. En Moyenne Tension, le tarif énergie tombe à ${prixMt} DT/kWh au lieu de ${prixBt} DT/kWh.`;
  });

  protected readonly etude = computed(() => this.btResult()?.etude_bt_mt);

  protected readonly btConsommationAnnuelle = computed(() => {
    const etude = this.etude();
    if (etude?.consommation_annuelle_kwh) {
      return Number(etude.consommation_annuelle_kwh);
    }
    const mensuelle = Number(this.facture().consommation_totale_kwh);
    return Number.isFinite(mensuelle) ? mensuelle * 12 : 0;
  });

  protected readonly btPisteSolaire = computed(() => this.etude()?.piste_solaire ?? null);

  protected readonly btSolarDisplay = computed(() => {
    const piste = this.btPisteSolaire();
    const annuelle = this.btConsommationAnnuelle();
    const defaultPiste =
      "une étude de faisabilité solaire permettrait de chiffrer le productible, l'investissement et le temps de retour propres à ce site.";

    if (this.showBtMtRevision()) {
      if (!piste) {
        return null;
      }
      return {
        badge: piste.badge ?? "UNE AUTRE PISTE D'ÉCONOMIE",
        titre: piste.titre,
        description: piste.description,
        piste: piste.piste,
        ctaLabel: 'Demander une étude solaire personnalisée',
      };
    }

    if (!Number.isFinite(annuelle) || annuelle <= 0) {
      return null;
    }

    return {
      badge: 'NOTRE RECOMMANDATION',
      titre: 'Installer du solaire chez vous.',
      description: `Avec environ ${this.formatComparisonNumber(String(annuelle))} kWh consommés par an, une installation solaire dimensionnée sur ce profil de consommation peut réduire durablement la part énergie de la facture.`,
      piste: piste?.piste ?? defaultPiste,
      ctaLabel: 'Voir le simulateur solaire détaillé',
    };
  });

  protected readonly economieMensuelle = computed(() => {
    const etude = this.etude();
    if (!etude) return '0';
    const annual = Number(etude.economie_annuelle_dt);
    if (!Number.isFinite(annual)) return '0';
    return this.formatComparisonNumber(String(annual / 12));
  });

  protected readonly mtFacture = computed(() => this.mtResult()!.facture);

  protected readonly mtUtilisationPct = computed(() => {
    const f = this.mtFacture();
    if (!f.puissance_souscrite_kva) return 0;
    return Math.round((f.puissance_max_kw / f.puissance_souscrite_kva) * 100);
  });

  protected readonly mtRatioProfile = computed((): MtRatioProfile => {
    const pct = this.mtUtilisationPct();
    if (pct > 100) return 'P4';
    if (pct > 95) return 'P3';
    if (pct >= 45 && pct <= 60) return 'P2';
    if (pct < 45) return 'P1';
    return 'P0';
  });

  protected readonly mtDepassementKva = computed(() => {
    const f = this.mtFacture();
    return Math.max(0, f.puissance_max_kw - f.puissance_souscrite_kva);
  });

  protected readonly mtPuissanceCibleKva = computed(
    () => this.mtResult()?.revision?.puissance_cible_kva ?? Math.ceil(this.mtFacture().puissance_max_kw / 0.7)
  );

  protected readonly mtSituationView = computed((): MtSituationView => {
    const f = this.mtFacture();
    const profile = this.mtRatioProfile();
    const kva = this.formatComparisonNumber(f.puissance_souscrite_kva);
    const kw = this.formatComparisonNumber(f.puissance_max_kw);
    const pct = this.mtUtilisationPct();
    const cible = this.formatComparisonNumber(this.mtPuissanceCibleKva());
    const marge = this.formatComparisonNumber(this.mtMargeDisponible());
    const depassement = this.formatComparisonNumber(this.mtDepassementKva());
    const revision = this.mtResult()!.revision;

    switch (profile) {
      case 'P2':
        return {
          profile,
          badge: '45–60 % • P2',
          badgeTone: 'gold',
          titre: 'Vous réservez plus de puissance que ce dont votre activité a vraiment besoin.',
          metricLabel: 'Puissance cible (70%)',
          metricValue: `${cible} kVA`,
          metricDanger: false,
          optimizationNote: `Une optimisation vers ${cible} kVA (cible 70%) représente un gain potentiel de ${this.formatComparisonNumber(revision.economie_mensuelle_dt)} DT/mois.`,
          monthlyGain: `${this.formatComparisonNumber(revision.economie_mensuelle_dt)} DT/mois`,
          annualGain: `${this.formatComparisonNumber(revision.economie_annuelle_dt)} DT/an`,
          donutDanger: false,
        };
      case 'P3':
        return {
          profile,
          badge: 'ratio > 95% • P3',
          badgeTone: 'warning',
          titre: 'Vous frôlez la limite de votre contrat — la marge de sécurité a quasiment disparu.',
          metricLabel: 'Marge disponible',
          metricValue: `${marge} kVA`,
          metricDanger: false,
          donutDanger: false,
        };
      case 'P4':
        return {
          profile,
          badge: 'dépassement constaté • P4',
          badgeTone: 'danger',
          titre: 'Vous avez dépassé votre puissance contractuelle — et la STEG vous le facture.',
          metricLabel: 'Dépassement',
          metricValue: `${depassement} kVA`,
          metricDanger: true,
          donutDanger: true,
        };
      case 'P1':
        return {
          profile,
          badge: 'ratio < 45% • P1',
          badgeTone: 'gold',
          titre: 'Vous payez chaque mois pour une puissance que vous n\'utilisez pas.',
          metricLabel: 'Puissance cible (70%)',
          metricValue: `${cible} kVA`,
          metricDanger: false,
          donutDanger: false,
        };
      default:
        return {
          profile: 'P0',
          badge: `ratio ${pct}%`,
          badgeTone: 'outline',
          titre: this.mtResult()!.situation_titre,
          metricLabel: 'Marge disponible',
          metricValue: `${marge} kVA libre`,
          metricDanger: false,
          donutDanger: false,
        };
    }
  });

  protected readonly mtMargeDisponible = computed(() => {
    const f = this.mtFacture();
    return f.puissance_souscrite_kva - f.puissance_max_kw;
  });

  protected readonly mtDonutDasharray = computed(() => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(this.mtUtilisationPct(), 100);
    const used = circumference * (pct / 100);
    return `${used} ${circumference - used}`;
  });

  protected readonly mtDetailRows = computed((): DetailFactureRow[] => {
    const f = this.mtFacture();
    const tip = (key: string) => this.mtFieldTip(key);

    return [
      {
        label: 'Mois de facturation',
        value: f.periode,
        explication: tip('mois_facturation'),
      },
      {
        label: 'Puissance souscrite',
        value: `${this.formatComparisonNumber(f.puissance_souscrite_kva)} kVA`,
        explication: tip('puissance_souscrite_kva'),
      },
      {
        label: 'Puissance maximale appelée',
        value: `${this.formatComparisonNumber(f.puissance_max_kw)} kW`,
        explication: tip('puissance_maximale_appelee_kw'),
      },
      {
        label: 'Consommation totale',
        value: `${this.formatComparisonNumber(f.consommation_kwh)} kWh`,
        explication: tip('consommation_totale_kwh'),
      },
      {
        label: 'Cos φ',
        value: f.cos_phi.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        explication: tip('cos_phi'),
      },
      {
        label: 'Prime de puissance',
        value: `${this.formatComparisonNumber(f.prime_puissance_dt)} DT`,
        explication: tip('prime_puissance'),
      },
      {
        label: 'Montant net à payer',
        value: `${this.formatComparisonNumber(f.montant_net_dt)} DT`,
        highlight: true,
        explication: tip('montant_net_a_payer'),
      },
    ];
  });

  protected readonly detailFactureRows = computed((): DetailFactureRow[] => {
    const f = this.facture();
    const tip = (key: string) => this.fieldTip(key);

    return [
      {
        label: 'Période',
        value: f.periode_facturation === '1' ? 'Mensuelle' : 'Période facturée',
        explication: tip('periode_facturation'),
      },
      {
        label: 'Puissance souscrite',
        value: `${this.formatNumber(f.puissance_souscrite_kva)} kVA`,
        explication: tip('puissance_souscrite_kva'),
      },
      {
        label: 'Consommation totale',
        value: `${this.formatNumber(f.consommation_totale_kwh)} kWh`,
        explication: tip('consommation_totale_kwh'),
      },
      {
        label: 'Prix unitaire',
        value: `${f.prix_unitaire} DT/kWh`,
        explication: tip('prix_unitaire'),
      },
      {
        label: 'Redevances fixes',
        value: `${this.formatAmount(f.redevances_fixes)} DT`,
        explication: tip('redevances_fixes'),
      },
      {
        label: 'Montant à payer',
        value: `${this.montantAPayer()} DT`,
        highlight: true,
        explication: tip('montant_a_payer') || tip('montant_total'),
      },
    ];
  });

  protected fieldTip(key: string): string {
    const fromApi = this.affichageExplanation(key);
    if (fromApi) return fromApi;
    return BT_FIELD_TIPS[key] ?? '';
  }

  protected mtFieldTip(key: string): string {
    const field = this.mtResult()?.affichage_client?.[key];
    if (field && typeof field !== 'string') {
      const { explication } = field as AffichageField;
      if (explication) return explication;
    }
    return MT_FIELD_TIPS[key] ?? '';
  }

  protected readonly vanChart = computed((): VanChartData | null => {
    const etude = this.etude();
    if (!etude) return null;

    const capex = Number(etude.capex_dt);
    const economie = Number(etude.economie_annuelle_dt);
    const van = Number(etude.van_dt);
    if (!Number.isFinite(capex) || !Number.isFinite(economie)) return null;

    const points: { year: number; value: number }[] = [];
    for (let year = 1; year <= 25; year++) {
      const linear = economie * year - capex;
      const blend = linear + (van - linear) * (year / 25) * 0.35;
      points.push({ year, value: blend });
    }

    const maxY = Math.max(van, capex, ...points.map((p) => p.value)) * 1.08;
    return { points, capex, minY: 0, maxY };
  });

  ngOnInit(): void {
    const useMock = this.route.snapshot.queryParamMap.get('mock') === 'true';

    if (useMock) {
      const type = this.route.snapshot.queryParamMap.get('type');
      this.tariffType.set(type === 'MT' ? 'MT' : 'BT');
      this.btResult.set(MOCK_BT_RESULT);
      this.mtResult.set(MOCK_MT_RESULT);
    } else {
      const mapped = this.analyseFactureStore.getMappedResult();
      if (!mapped) {
        void this.router.navigate(['/analyse-facture']);
        return;
      }

      this.tariffType.set(mapped.tariffType);
      if (mapped.btResult) {
        this.btResult.set(mapped.btResult);
      }
      if (mapped.mtResult) {
        this.mtResult.set(mapped.mtResult);
      }
    }

    this.seoService.setSEO({
      title: 'Résultats analyse facture | JOYA Energy',
      description: 'Résultats de l’analyse de votre facture STEG.',
      url: 'https://joya-energy.com/analyse-facture/resultats',
    });
  }

  protected isStepClickable(stepNumber: number): boolean {
    const step = this.steps.find((s) => s.number === stepNumber);
    return !!step && !step.isResult && stepNumber < this.currentStep();
  }

  protected goToStep(stepNumber: number): void {
    if (!this.isStepClickable(stepNumber)) {
      return;
    }
    void this.router.navigate(['/analyse-facture'], { queryParams: { step: stepNumber } });
  }

  protected chartLinePoints(chart: VanChartData): string {
    return chart.points
      .map((_, index) => {
        const { x, y } = this.chartPointAt(chart, index);
        return `${x},${y}`;
      })
      .join(' ');
  }

  protected chartAreaPoints(chart: VanChartData): string | null {
    const zeroY = this.chartZeroY(chart);
    const lastIndex = chart.points.length - 1;

    let positiveStart = -1;
    for (let i = 0; i <= lastIndex; i++) {
      if (chart.points[i].value > 0) {
        positiveStart = i;
        break;
      }
    }
    if (positiveStart === -1) {
      return null;
    }

    let startX: number;
    if (positiveStart > 0) {
      const i = positiveStart - 1;
      const v0 = chart.points[i].value;
      const v1 = chart.points[i + 1].value;
      const t = (0 - v0) / (v1 - v0);
      const p0 = this.chartPointAt(chart, i);
      const p1 = this.chartPointAt(chart, i + 1);
      startX = p0.x + t * (p1.x - p0.x);
    } else {
      startX = this.chartPointAt(chart, 0).x;
    }

    const parts = [`${startX},${zeroY}`];
    for (let i = positiveStart; i <= lastIndex; i++) {
      const { x, y } = this.chartPointAt(chart, i);
      parts.push(`${x},${y}`);
    }
    const last = this.chartPointAt(chart, lastIndex);
    parts.push(`${last.x},${zeroY}`);
    return parts.join(' ');
  }

  protected readonly chartPadding = 24;

  protected chartCapexIntersectionPoint(chart: VanChartData): { x: number; y: number } | null {
    const x = this.chartCapexIntersectionX(chart);
    if (x === null) {
      return null;
    }
    return { x, y: this.chartCapexY(chart) };
  }

  protected chartMarkerIndices(chart: VanChartData): number[] {
    return chart.points
      .map((point, index) => ({ year: point.year, index }))
      .filter((point) => point.year === 1 || point.year % 5 === 0 || point.year === 25)
      .map((point) => point.index);
  }

  protected chartPointAt(chart: VanChartData, index: number): { x: number; y: number } {
    const plotWidth = this.chartWidth - this.chartPadding * 2;
    const x = this.chartPadding + (index / (chart.points.length - 1)) * plotWidth;
    const y = this.chartValueY(chart, chart.points[index].value);
    return { x, y };
  }

  protected chartPaybackLabel(): string | null {
    const etude = this.etude();
    if (!etude?.payback_simple_ans) {
      return null;
    }
    const paybackYears = Number(etude.payback_simple_ans);
    if (!Number.isFinite(paybackYears)) {
      return null;
    }
    const years = Math.floor(paybackYears);
    const months = Math.round((paybackYears - years) * 12);
    return `${years} ans et ${months} mois`;
  }

  protected chartCapexY(chart: VanChartData): number {
    return this.chartValueY(chart, chart.capex);
  }

  protected chartZeroY(chart: VanChartData): number {
    return this.chartValueY(chart, 0);
  }

  protected chartCapexLineEndX(chart: VanChartData): number | null {
    const intersectionX = this.chartCapexIntersectionX(chart);
    if (intersectionX === null) {
      return null;
    }

    const gap = 10;
    const minEnd = this.chartPadding + 16;
    return Math.max(minEnd, intersectionX - gap);
  }

  private chartCapexIntersectionX(chart: VanChartData): number | null {
    const capex = chart.capex;
    const lastIndex = chart.points.length - 1;

    for (let i = 0; i < lastIndex; i++) {
      const v0 = chart.points[i].value;
      const v1 = chart.points[i + 1].value;
      if (v0 < capex && v1 >= capex) {
        const t = (capex - v0) / (v1 - v0);
        const p0 = this.chartPointAt(chart, i);
        const p1 = this.chartPointAt(chart, i + 1);
        return p0.x + t * (p1.x - p0.x);
      }
    }

    return null;
  }

  protected chartYAxisTicks(chart: VanChartData): string[] {
    const steps = 7;
    const ticks: string[] = [];
    const range = chart.maxY - chart.minY;
    for (let i = 0; i <= steps; i++) {
      const value = chart.minY + (range / steps) * i;
      ticks.push(`${Math.round(value / 1000)}k`);
    }
    return ticks.reverse();
  }

  protected formatNumber(value: string): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
  }

  protected formatComparisonNumber(value: string | number): string {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }

  protected formatAmount(value: string): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  protected formatPayback(value: string): string {
    const payback = Number(value);
    if (!Number.isFinite(payback)) return value;
    return payback.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  protected formatPercent(value: string): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  private formatDateFr(isoDate: string): string {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return isoDate;
    return `${day}/${month}/${year}`;
  }

  private affichageExplanation(key: string): string | undefined {
    const field = this.btResult()?.affichage_client[key];
    if (!field || typeof field === 'string') return undefined;
    const { explication } = field as AffichageField;
    return explication || undefined;
  }

  private readonly chartWidth = 1000;
  private readonly chartHeight = 400;

  private chartValueY(chart: VanChartData, value: number): number {
    const plotHeight = this.chartHeight - this.chartPadding * 2;
    const range = chart.maxY - chart.minY;
    const scaledY =
      this.chartHeight - this.chartPadding - ((value - chart.minY) / range) * plotHeight;
    const zeroY = this.chartHeight - this.chartPadding - ((0 - chart.minY) / range) * plotHeight;
    return value < 0 ? zeroY : scaledY;
  }
}
