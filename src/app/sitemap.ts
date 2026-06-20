import { MetadataRoute } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { DEFAULT_CONTENT } from '@/data/default-content';

const BASE_URL = 'https://jmc-sjs.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/notices`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/challenge-problems`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/developers`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  // Dynamically load articles slugs if available
  let articles = (DEFAULT_CONTENT as any).articles || [];
  try {
    const filePath = path.join(process.cwd(), 'src/data/site-content.json');
    const fileDataStr = await fs.readFile(filePath, 'utf-8');
    if (fileDataStr) {
      const parsed = JSON.parse(fileDataStr);
      articles = parsed.articles || articles;
    }
  } catch (error) {
    console.error('Failed to read articles in sitemap generation:', error);
  }

  const dynamicArticleRoutes = articles.map((article: any) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: article.date ? new Date(article.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...dynamicArticleRoutes];
}
