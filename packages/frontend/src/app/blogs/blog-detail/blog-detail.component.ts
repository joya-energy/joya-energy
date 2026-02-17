import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { getBlogPostById, getRelatedPosts } from '../data/blog-posts';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SEOService);

  private readonly id = signal<string | null>(null);
  private paramSub?: Subscription;

  protected readonly post = computed(() => {
    const id = this.id();
    return id ? getBlogPostById(id) : undefined;
  });

  protected readonly relatedPosts = computed(() => {
    const id = this.id();
    return id ? getRelatedPosts(id, 3) : [];
  });

  ngOnInit(): void {
    document.body.classList.add('blog-route', 'blog-detail-route');
    const updateId = (id: string | null) => {
      this.id.set(id);
      const p = getBlogPostById(id ?? '');
      if (p) {
        this.seoService.setSEO({
          title: `${p.title} | Blog JOYA Energy`,
          description: p.excerpt,
          url: `https://joya-energy.com/blogs/${p.id}`,
          keywords: 'blog énergie solaire Tunisie, JOYA Energy, ' + p.category,
        });
      }
    };
    updateId(this.route.snapshot.paramMap.get('id'));
    this.paramSub = this.route.paramMap.subscribe((params) => {
      updateId(params.get('id'));
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    document.body.classList.remove('blog-route', 'blog-detail-route');
  }

  /** Reused from blog-list: same author initial logic. */
  protected getAuthorInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
