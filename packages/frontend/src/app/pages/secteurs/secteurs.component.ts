import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';

interface SectorItem {
  key: string;
  label: string;
  title: string;
  body: string;
  chips: Array<{ small: string; span: string }>;
  example?: { title: string; text: string };
  image: string;
  alt: string;
  objectPosition: string;
}

@Component({
  selector: 'app-secteurs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './secteurs.component.html',
  styleUrl: './secteurs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecteursComponent implements OnInit, AfterViewInit, OnDestroy {
  private seoService = inject(SEOService);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private motion = inject(HandoffMotionService);

  protected readonly activeIndex = signal(0);

  protected readonly sectors: SectorItem[] = [
    {
      key: 'ecole',
      label: 'Éducation',
      title: 'Éducation',
      body: 'Facture élevée en journée (climatisation, éclairage, équipements) : un profil en phase avec la production solaire diurne.',
      chips: [
        { small: 'Consommation', span: 'Élevée en journée' },
        { small: 'Postes principaux', span: 'Climatisation, éclairage, équipements' },
      ],
      // TODO: restore real example when available
      // example: {
      //   title: 'Exemple',
      //   text: 'Premier site installé par Joya — économies mesurées dès le premier trimestre.',
      // },
      image: '/handoff/images/sector-education-classroom-golden-light.jpg',
      alt: 'Salle de classe vide, baignée de lumière dorée',
      objectPosition: '50% 45%',
    },
    {
      key: 'sante',
      label: 'Santé',
      title: 'Santé',
      body: "Consommation continue et critique (réfrigération, équipements médicaux) : la fiabilité compte autant que l'économie.",
      chips: [
        { small: 'Consommation', span: 'Continue et critique' },
        { small: 'Postes principaux', span: 'Réfrigération, équipements médicaux' },
      ],
      // TODO: restore real example when available
      // example: {
      //   title: 'Exemple',
      //   text: 'Pharmacie Chouikha, Clinique Majus El Fahs — déployés et suivis via Joya OS.',
      // },
      image: '/handoff/images/sector-health-nurse-stethoscope.jpg',
      alt: 'Soignant en blouse orange tenant un stéthoscope',
      objectPosition: '40% 50%',
    },
    {
      key: 'agro',
      label: 'Agroalimentaire',
      title: 'Agroalimentaire',
      body: "Fours, chambres froides, lignes de production : une des consommations les plus élevées des PME, donc un fort potentiel d'économies.",
      chips: [
        { small: 'Consommation', span: 'Parmi les plus élevées des PME' },
        { small: 'Postes principaux', span: 'Fours, chambres froides, lignes de production' },
      ],
      image: '/handoff/images/sector-agrifood-tractor-field.jpg',
      alt: 'Tracteur au travail dans un champ, à la lumière du soir',
      objectPosition: '60% 55%',
    },
    {
      key: 'hotellerie',
      label: 'Hôtellerie',
      title: 'Hôtellerie',
      body: "Pics saisonniers (climatisation, eau chaude) : le solaire lisse les coûts sur l'année, sans avance en basse saison.",
      chips: [
        { small: 'Consommation', span: 'Pics saisonniers' },
        { small: 'Postes principaux', span: 'Climatisation, eau chaude' },
      ],
      image: '/handoff/images/sector-hospitality-hotel-lobby-luggage-cart.jpg',
      alt: "Chariot à bagages dans un hall d'hôtel ensoleillé",
      objectPosition: '50% 55%',
    },
    {
      key: 'industrie',
      label: 'Industrie & PME',
      title: 'Industrie & PME',
      body: 'Consommation régulière et prévisible : idéal pour un contrat de service énergétique long terme, aux économies stables.',
      chips: [
        { small: 'Consommation', span: 'Régulière et prévisible' },
        { small: 'Idéal pour', span: 'Un contrat de service énergétique long terme' },
      ],
      // TODO: restore real example when available
      // example: {
      //   title: 'Exemple',
      //   text: 'Kiosque Shell Manouba, MCW Mghira.',
      // },
      image: '/handoff/images/sector-industry-sme-plant-sunset.jpg',
      alt: 'Site industriel avec cheminée et convoyeurs au coucher du soleil',
      objectPosition: '62% 42%',
    },
  ];

  private fragmentSub?: { unsubscribe(): void };

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Secteurs — Joya Energy',
      description:
        'École, clinique, boulangerie, hôtel, PME industrielle : le solaire adapté au profil de consommation de chaque secteur.',
      url: 'https://joya-energy.com/secteurs',
      keywords: 'secteurs, éducation, santé, agroalimentaire, hôtellerie, industrie, solaire Tunisie',
    });

    this.fragmentSub = this.route.fragment.subscribe((fragment) => {
      if (!fragment) return;
      const idx = this.sectors.findIndex((s) => s.key === fragment);
      if (idx >= 0) this.selectSector(idx, false);
    });
  }

  ngOnDestroy(): void {
    this.fragmentSub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.motion.refresh();
  }

  protected selectSector(index: number, updateHash = true): void {
    this.activeIndex.set(index);
    if (!updateHash || !isPlatformBrowser(this.platformId)) return;
    const key = this.sectors[index]?.key;
    if (!key) return;
    const url = `${this.document.location.pathname}#${key}`;
    history.replaceState(null, '', url);
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
