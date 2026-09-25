import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ElementRef,
  viewChild,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { HandoffMotionService } from '../../core/services/handoff-motion.service';
import { BLOG_POSTS, BlogPost } from '../../blogs/data/blog-posts';

const BLOG_FALLBACK_IMAGES = [
  '/handoff/images/hero-solar-roof-sunset.jpg',
  '/handoff/images/blog-thumb-energy-dashboard-screenshot.jpg',
  '/handoff/images/installer-hand-on-solar-panel-sunset.jpg',
  '/handoff/images/blog-thumb-tablet-solar-monitoring.jpg',
  '/handoff/images/sector-industry-sme-plant-sunset.jpg',
] as const;

@Component({
  selector: 'app-ressources',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ressources.component.html',
  styleUrl: './ressources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RessourcesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly motion = inject(HandoffMotionService);

  private readonly blogTrack = viewChild<ElementRef<HTMLElement>>('blogTrack');

  protected readonly featuredPost = BLOG_POSTS[0];
  protected readonly latestPosts = BLOG_POSTS.slice(1);
  protected readonly carouselPosts = BLOG_POSTS;
  protected readonly canScrollPrev = signal(false);
  protected readonly canScrollNext = signal(true);

  private resizeObserver?: ResizeObserver;

  ngOnInit(): void {
    this.seoService.setSEO({
      title: 'Ressources — Joya Energy',
      description:
        "Cinq simulateurs gratuits pour mesurer votre potentiel solaire, votre facture et votre empreinte carbone — et un accompagnement pour passer à l'action.",
      url: 'https://joya-energy.com/ressources',
      keywords:
        'simulateurs solaires, audit solaire, bilan carbone, facture STEG, subventions FTE, blog énergie Tunisie',
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.motion.refresh();
    this.updateArrowState();
    const track = this.blogTrack()?.nativeElement;
    if (!track) return;
    track.addEventListener('scroll', this.onTrackScroll, { passive: true });
    this.resizeObserver = new ResizeObserver(() => this.updateArrowState());
    this.resizeObserver.observe(track);
  }

  ngOnDestroy(): void {
    const track = this.blogTrack()?.nativeElement;
    track?.removeEventListener('scroll', this.onTrackScroll);
    this.resizeObserver?.disconnect();
  }

  protected postImage(post: BlogPost, index = 0): string {
    if (post.imageUrl?.trim()) return post.imageUrl;
    return BLOG_FALLBACK_IMAGES[index % BLOG_FALLBACK_IMAGES.length];
  }

  protected readingLabel(post: BlogPost): string {
    const source = `${post.excerpt ?? ''} ${post.content ?? ''}`;
    const words = source.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(3, Math.round(words / 200));
    return `${minutes} min de lecture`;
  }

  protected scrollBlog(direction: -1 | 1): void {
    const track = this.blogTrack()?.nativeElement;
    if (!track) return;
    const card = track.querySelector('.bcard');
    const step = card instanceof HTMLElement ? card.offsetWidth + 20 : 280;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  private readonly onTrackScroll = (): void => this.updateArrowState();

  private updateArrowState(): void {
    const track = this.blogTrack()?.nativeElement;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    this.canScrollPrev.set(track.scrollLeft > 4);
    this.canScrollNext.set(track.scrollLeft < max - 4);
  }
}
