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
import { RouterLink } from '@angular/router';
import { SEOService } from '../../core/services/seo.service';
import { BLOG_POSTS } from '../../blogs/data/blog-posts';

const PAGE1_SIZE = 7;
const PAGE_OTHER_SIZE = 6;

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogsComponent implements OnInit, OnDestroy {
  private readonly seoService = inject(SEOService);

  protected readonly currentPage = signal(1);

  protected readonly totalPages = computed(() => {
    const total = BLOG_POSTS.length;
    return total <= PAGE1_SIZE ? 1 : 1 + Math.ceil((total - PAGE1_SIZE) / PAGE_OTHER_SIZE);
  });

  protected readonly pageNumbers = computed(() => {
    const n = this.totalPages();
    return Array.from({ length: n }, (_, i) => i + 1);
  });

  protected readonly featuredPost = computed(() => {
    return this.currentPage() === 1 ? BLOG_POSTS[0] : null;
  });

  protected readonly gridPosts = computed(() => {
    const page = this.currentPage();
    const total = BLOG_POSTS.length;
    if (page === 1) {
      return BLOG_POSTS.slice(1, PAGE1_SIZE);
    }
    const start = PAGE1_SIZE + (page - 2) * PAGE_OTHER_SIZE;
    return BLOG_POSTS.slice(start, start + PAGE_OTHER_SIZE);
  });

  protected readonly isPageOne = computed(() => this.currentPage() === 1);

  ngOnInit(): void {
    document.body.classList.add('blog-route');
    this.seoService.setSEO({
      title: 'Blogs | JOYA Energy',
      description:
        "Articles et actualités sur l'énergie solaire, la transition énergétique et les solutions photovoltaïques pour les entreprises en Tunisie.",
      url: 'https://joya-energy.com/blogs',
      keywords:
        'blog énergie solaire Tunisie, actualités solaire, transition énergétique, JOYA Energy',
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('blog-route');
  }

  protected getAuthorInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected setPage(page: number): void {
    const max = this.totalPages();
    if (page >= 1 && page <= max) {
      this.currentPage.set(page);
    }
  }
}
