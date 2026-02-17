export interface BlogAuthor {
  name: string;
  role: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  author: BlogAuthor;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: "first blog",
    excerpt:
      "details",
    imageUrl: '',
    date: '02 Feb 2026',
    category: 'Énergie solaire',
    author: { name: 'X', role: '' },
  },

];

export function getBlogPostById(id: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.id === id);
}

export function getRelatedPosts(excludeId: string, limit = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.id !== excludeId).slice(0, limit);
}
