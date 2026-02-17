import { RenderMode, ServerRoute } from '@angular/ssr';
import { BLOG_POSTS } from './blogs/data/blog-posts';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'blogs/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      // Prerender one page per blog post id
      return BLOG_POSTS.map((p) => ({ id: p.id }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
